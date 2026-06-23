from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import sys
from datetime import datetime

from backend.app.database.dependencies import get_db
from backend.app.services.billing_service import BillingService

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Try different APIs
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@router.post("/ask")
def ask_chatbot(
    query: str,
    db: Session = Depends(get_db)
):
    service = BillingService(db)
    
    # Get data
    summary = service.get_analytics_summary()
    top_services = service.get_top_services(10)
    top_projects = service.get_top_projects(10)
    monthly_trend = service.get_monthly_trend(24)
    current_month = service.get_current_month_summary()
    
    # Build data context
    data_context = {
        "total_records": summary['total_records'],
        "total_cost": f"${summary['total_cost']:.2f}",
        "average_cost": f"${summary['average_cost']:.2f}",
        "services": [{"name": s['service'], "cost": f"${s['total_cost']:.2f}"} for s in top_services],
        "projects": [{"name": p['project'], "cost": f"${p['total_cost']:.2f}"} for p in top_projects],
        "monthly_data": [{"month": m['month'], "cost": m['total_cost']} for m in monthly_trend],
        "environments": summary.get('environment_breakdown', []),
        "current_month": {
            "month": current_month['current_month'],
            "cost": current_month['current_month_cost'],
            "previous_month": current_month['previous_month'],
            "previous_cost": current_month['previous_month_cost'],
            "change_percent": current_month['change_percent']
        }
    }
    
    # ----- DEBUG: Check if GROQ_API_KEY is set (flush ensures it shows in logs) -----
    print(f"GROQ_API_KEY set: {bool(GROQ_API_KEY)}", flush=True)
    # --------------------------------------------------------------------------------
    
    # Build prompt
    prompt = f"""
You are a data analyst assistant. Answer the user's question based ONLY on the data provided.

DATA:
- Total Records: {data_context['total_records']}
- Total Cost: {data_context['total_cost']}
- Average Cost: {data_context['average_cost']}
- Top Services: {data_context['services'][:5]}
- Top Projects: {data_context['projects'][:5]}
- Monthly Trend (all months): {data_context['monthly_data']}
- Environments: {data_context['environments']}
- Current Month: {data_context['current_month']['month']} cost: ${data_context['current_month']['cost']:.2f}
- Previous Month: {data_context['current_month']['previous_month']} cost: ${data_context['current_month']['previous_cost']:.2f}
- Change: {f"{data_context['current_month']['change_percent']:.1f}%" if data_context['current_month']['change_percent'] is not None else "N/A"}

USER QUESTION: {query}

INSTRUCTIONS:
1. Analyze the data carefully.
2. If comparing months, find the specific months in the monthly_data.
3. Calculate differences when asked.
4. Provide specific numbers from the data.
5. Be concise and clear.
6. If the data doesn't contain the answer, say so politely.

ANSWER:
"""

    # Try Groq first (if available)
    if GROQ_API_KEY:
        try:
            from groq import Groq
            
            client = Groq(api_key=GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a data analyst assistant."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=500
            )
            
            answer = chat_completion.choices[0].message.content
            return {
                "response": answer,
                "data": data_context
            }
        except Exception as e:
            print(f"Groq error: {e}", flush=True)
            # Fall through to next option
    
    # Fallback: Rule-based responses
    return {
        "response": get_fallback_response(query, data_context),
        "data": data_context
    }


def get_fallback_response(query: str, data: dict):
    """Rule-based fallback when AI is unavailable."""
    query_lower = query.lower()
    
    # Extract months from question
    import re
    months = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    }
    
    # Try to find specific months in the question
    found_months = []
    for month_name, month_num in months.items():
        if month_name in query_lower:
            # Look for a year nearby
            year_match = re.search(r'(20\d{2})', query)
            year = year_match.group(1) if year_match else '2026'
            found_months.append(f"{year}-{month_num}")
    
    # If we found months in the question, show them
    if len(found_months) >= 2:
        month1 = found_months[0]
        month2 = found_months[1]
        
        # Find the data for these months
        m1_data = None
        m2_data = None
        for m in data['monthly_data']:
            if m['month'] == month1:
                m1_data = m
            if m['month'] == month2:
                m2_data = m
        
        if m1_data and m2_data:
            diff = m2_data['cost'] - m1_data['cost']
            return f"📊 {month1}: ${m1_data['cost']:.2f}\n📊 {month2}: ${m2_data['cost']:.2f}\n💰 Difference: ${abs(diff):.2f} ({'↑' if diff > 0 else '↓'})"
    
    # Compare last two months
    if any(word in query_lower for word in ['compare', 'difference', 'versus', 'vs']):
        latest = data['monthly_data'][-1]
        previous = data['monthly_data'][-2]
        diff = latest['cost'] - previous['cost']
        return f"📊 {latest['month']}: ${latest['cost']:.2f}\n📊 {previous['month']}: ${previous['cost']:.2f}\n💰 Difference: ${abs(diff):.2f} ({'↑' if diff > 0 else '↓'})"
    
    # Total spending
    if any(word in query_lower for word in ['total', 'spending']):
        return f"💰 Total: {data['total_cost']} from {data['total_records']} records\n📈 Average: {data['average_cost']}"
    
    # Top services
    if any(word in query_lower for word in ['service', 'services']):
        response = "🏆 Top services:\n"
        for s in data['services'][:5]:
            response += f"- {s['name']}: {s['cost']}\n"
        return response
    
    # Top projects
    if any(word in query_lower for word in ['project', 'projects']):
        response = "📊 Top projects:\n"
        for p in data['projects'][:5]:
            response += f"- {p['name']}: {p['cost']}\n"
        return response
    
    # Default summary
    return f"📊 Summary:\n💰 Total: {data['total_cost']}\n📊 Records: {data['total_records']}\n📈 Average: {data['average_cost']}"