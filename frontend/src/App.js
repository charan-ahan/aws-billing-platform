import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area, AreaChart
} from 'recharts';
import './App.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — 3 ACCOUNTS
// ═══════════════════════════════════════════════════════════════
const ACCOUNTS = [
  { id: "prod-main", label: "Production Main", total_cost: 134200.38 },
  { id: "prod-secondary", label: "Production Secondary", total_cost: 80520.23 },
  { id: "staging", label: "Staging", total_cost: 53680.14 }
];

const SERVICE_DATA = [
  { service: "Amazon EC2", prod_main: 44710.25, prod_sec: 26826.15, staging: 17884.10 },
  { service: "Amazon RDS", prod_main: 27090.13, prod_sec: 16254.08, staging: 10836.05 },
  { service: "Amazon S3", prod_main: 19470.40, prod_sec: 11682.24, staging: 7788.16 },
  { service: "CloudFront", prod_main: 14655.10, prod_sec: 8793.06, staging: 5862.04 },
  { service: "AWS Lambda", prod_main: 10800.08, prod_sec: 6480.05, staging: 4320.03 },
  { service: "Amazon EKS", prod_main: 9360.23, prod_sec: 5616.14, staging: 3744.09 },
  { service: "ElastiCache", prod_main: 6225.15, prod_sec: 3735.09, staging: 2490.06 },
  { service: "Others", prod_main: 1889.05, prod_sec: 1133.43, staging: 755.62 }
];

const CATEGORY_DATA = [
  { category: "Compute", prod_main: 44710, prod_sec: 26826, staging: 17884 },
  { category: "Database", prod_main: 27090, prod_sec: 16254, staging: 10836 },
  { category: "Storage", prod_main: 19470, prod_sec: 11682, staging: 7788 },
  { category: "Networking", prod_main: 14655, prod_sec: 8793, staging: 5862 },
  { category: "Analytics", prod_main: 10800, prod_sec: 6480, staging: 4320 },
  { category: "Other", prod_main: 17475, prod_sec: 10485, staging: 6990 }
];

const REGION_DATA = [
  { region: "us-east-1", prod_main: 56200, prod_sec: 33720, staging: 22480 },
  { region: "us-west-2", prod_main: 39150, prod_sec: 23490, staging: 15660 },
  { region: "eu-west-1", prod_main: 24600, prod_sec: 14760, staging: 9840 },
  { region: "ap-south-1", prod_main: 10550, prod_sec: 6330, staging: 4220 },
  { region: "ap-southeast-1", prod_main: 3700, prod_sec: 2220, staging: 1480 }
];

const INSTANCE_DATA = [
  { instance: "t3.medium", prod_main: 2264.25, prod_sec: 1358.55, staging: 905.70 },
  { instance: "t3.large", prod_main: 1920.38, prod_sec: 1152.23, staging: 768.15 },
  { instance: "m5.large", prod_main: 1625.10, prod_sec: 975.06, staging: 650.04 },
  { instance: "c5.xlarge", prod_main: 1340.40, prod_sec: 804.24, staging: 536.16 },
  { instance: "r5.large", prod_main: 970.18, prod_sec: 582.11, staging: 388.07 }
];

const ENV_DATA = [
  { environment: "Production", prod_main: 89200, prod_sec: 53520, staging: 35680 },
  { environment: "Staging", prod_main: 28100, prod_sec: 16860, staging: 11240 },
  { environment: "Development", prod_main: 11200, prod_sec: 6720, staging: 4480 },
  { environment: "QA", prod_main: 5700, prod_sec: 3420, staging: 2280 }
];

const PROJECT_DATA = [
  { project: "E-Commerce Platform", prod_main: 42100.13, prod_sec: 25260.08, staging: 16840.05 },
  { project: "Data Analytics Hub", prod_main: 28170.25, prod_sec: 16902.15, staging: 11268.10 },
  { project: "Mobile Backend", prod_main: 21090.15, prod_sec: 12654.09, staging: 8436.06 },
  { project: "ML Pipeline", prod_main: 15860.23, prod_sec: 9516.14, staging: 6344.09 },
  { project: "DevOps Infra", prod_main: 10980.13, prod_sec: 6588.08, staging: 4392.05 }
];

// Monthly trend per account
const MONTHLY_TREND = [
  { month: "Jul '25", prod_main: 71150, prod_sec: 42690, staging: 28460 },
  { month: "Aug '25", prod_main: 79350, prod_sec: 47610, staging: 31740 },
  { month: "Sep '25", prod_main: 67100, prod_sec: 40260, staging: 26840 },
  { month: "Oct '25", prod_main: 85750, prod_sec: 51450, staging: 34300 },
  { month: "Nov '25", prod_main: 94600, prod_sec: 56760, staging: 37840 },
  { month: "Dec '25", prod_main: 101700, prod_sec: 61020, staging: 40680 },
  { month: "Jan '26", prod_main: 98400, prod_sec: 59040, staging: 39360 },
  { month: "Feb '26", prod_main: 110650, prod_sec: 66390, staging: 44260 },
  { month: "Mar '26", prod_main: 119450, prod_sec: 71670, staging: 47780 },
  { month: "Apr '26", prod_main: 107800, prod_sec: 64680, staging: 43120 },
  { month: "May '26", prod_main: 123550, prod_sec: 74130, staging: 49420 },
  { month: "Jun '26", prod_main: 134200, prod_sec: 80520, staging: 53680 }
];

const HOURLY_TREND = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2,'0')}:00`,
  prod_main: i < 6 ? 60 + Math.sin(i)*40 : i < 12 ? 160 + Math.sin(i)*100 : i < 18 ? 240 + Math.sin(i)*90 : 130 + Math.sin(i)*70,
  prod_sec: i < 6 ? 36 + Math.sin(i)*24 : i < 12 ? 96 + Math.sin(i)*60 : i < 18 ? 144 + Math.sin(i)*54 : 78 + Math.sin(i)*42,
  staging: i < 6 ? 24 + Math.sin(i)*16 : i < 12 ? 64 + Math.sin(i)*40 : i < 18 ? 96 + Math.sin(i)*36 : 52 + Math.sin(i)*28
}));

const DAILY_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `Jun ${i+1}`,
  prod_main: 3000 + Math.sin(i*0.4)*1000 + (i%3)*250,
  prod_sec: 1800 + Math.sin(i*0.4)*600 + (i%3)*150,
  staging: 1200 + Math.sin(i*0.4)*400 + (i%3)*100
}));

const DATA_TRANSFER = [
  { month: "Jul", prod_main: 900, prod_sec: 540, staging: 360 },
  { month: "Aug", prod_main: 1050, prod_sec: 630, staging: 420 },
  { month: "Sep", prod_main: 975, prod_sec: 585, staging: 390 },
  { month: "Oct", prod_main: 1150, prod_sec: 690, staging: 460 },
  { month: "Nov", prod_main: 1250, prod_sec: 750, staging: 500 },
  { month: "Dec", prod_main: 1400, prod_sec: 840, staging: 560 },
  { month: "Jan", prod_main: 1550, prod_sec: 930, staging: 620 },
  { month: "Feb", prod_main: 1450, prod_sec: 870, staging: 580 },
  { month: "Mar", prod_main: 1700, prod_sec: 1020, staging: 680 },
  { month: "Apr", prod_main: 1800, prod_sec: 1080, staging: 720 },
  { month: "May", prod_main: 2000, prod_sec: 1200, staging: 800 },
  { month: "Jun", prod_main: 2250, prod_sec: 1350, staging: 900 }
];

const SAVINGS_PLANS = {
  coverage: 68.5,
  utilization: 72.3,
  monthly_savings: 34200,
  total_savings: 208400,
  commitment: 42000,
  actual: 31680
};

const TRANSACTIONS = [
  { id: 1, date: "2026-06-25", service: "Amazon EC2", account: "prod-main", amount: 2341.50, category: "Compute" },
  { id: 2, date: "2026-06-25", service: "Amazon RDS", account: "prod-main", amount: 1876.20, category: "Database" },
  { id: 3, date: "2026-06-24", service: "Amazon S3", account: "prod-secondary", amount: 432.80, category: "Storage" },
  { id: 4, date: "2026-06-24", service: "CloudFront", account: "prod-main", amount: 891.40, category: "Networking" },
  { id: 5, date: "2026-06-23", service: "AWS Lambda", account: "staging", amount: 234.10, category: "Compute" },
  { id: 6, date: "2026-06-23", service: "AWS Glue", account: "prod-secondary", amount: 567.50, category: "Analytics" },
  { id: 7, date: "2026-06-22", service: "Amazon EC2", account: "prod-main", amount: 3201.15, category: "Compute" },
  { id: 8, date: "2026-06-22", service: "Amazon S3", account: "prod-main", amount: 928.80, category: "Storage" },
  { id: 9, date: "2026-06-22", service: "Amazon Redshift", account: "prod-secondary", amount: 2154.40, category: "Database" },
  { id: 10, date: "2026-06-21", service: "AWS Lambda", account: "prod-main", amount: 387.75, category: "Compute" }
];

const BUDGET = {
  total_budget: 300000,
  spent: 268400,
  remaining: 31600,
  percent_used: 89.47
};

const ANOMALIES = [
  { service: "EC2", region: "us-east-1", spike: "+247%", cost: "$12,400", time: "2h ago", severity: "critical" },
  { service: "RDS", region: "eu-west-1", spike: "+89%", cost: "$4,210", time: "6h ago", severity: "high" },
  { service: "Lambda", region: "us-west-2", spike: "+134%", cost: "$2,890", time: "1d ago", severity: "medium" }
];

const CATEGORY_COLORS = {
  Compute: "#2563EB", Database: "#8B5CF6", Storage: "#06B6D4",
  Networking: "#10B981", Analytics: "#F59E0B", Other: "#64748B"
};

const PIE_COLORS = ["#2563EB","#8B5CF6","#06B6D4","#10B981","#F59E0B","#EF4444","#EC4899","#64748B"];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "explorer", label: "Cost Explorer", icon: "◎" },
  { id: "anomalies", label: "Anomaly Detection", icon: "◬", badge: 3 },
  { id: "budgets", label: "Budget Tracker", icon: "◉" },
  { id: "savings", label: "Savings Plans", icon: "◌" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "settings", label: "Settings", icon: "⚙" }
];

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
const fmtK = n => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${Number(n).toFixed(0)}`;
const fmtFull = n => `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// Get data for selected account
const getAccountData = (data, account) => {
  if (account === 'all') {
    return data.map(d => ({
      ...d,
      total_cost: (d.prod_main || 0) + (d.prod_sec || 0) + (d.staging || 0)
    }));
  }
  const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
  const key = keyMap[account] || 'prod_main';
  return data.map(d => ({
    ...d,
    total_cost: d[key] || 0
  }));
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM RECHARTS TOOLTIP
// ═══════════════════════════════════════════════════════════════
const DarkTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(13,21,37,0.97)', border:'1px solid #1E293B', borderRadius:10,
      padding:'10px 14px', fontSize:12, color:'#F1F5F9', boxShadow:'0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color:'#94A3B8', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }}/>
          <span style={{ color:'#94A3B8' }}>{p.name}:</span>
          <span style={{ fontFamily:'monospace', fontWeight:700, color:p.color }}>
            {suffix ? `${Number(p.value).toFixed(0)} ${suffix}` : fmtK(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════
function KPICard({ label, value, sub, trend, color="#2563EB", delay=0, sparkData=[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const isPos = trend > 0;
  const mini = sparkData.length > 1 ? sparkData : [];
  const mn = mini.length ? Math.min(...mini) : 0;
  const mx = mini.length ? Math.max(...mini) : 1;
  const pts = mini.map((v,i) => {
    const x = (i / (mini.length-1)) * 100;
    const y = 28 - ((v-mn)/(mx-mn||1))*22;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`kpi-card ${visible ? 'kpi-visible' : ''}`} style={{'--kpi-delay': `${delay}ms`,'--kpi-color': color}}>
      <div className="kpi-glow" />
      <div className="kpi-top-row">
        <span className="kpi-label-text">{label}</span>
        <span className={`kpi-trend-pill ${isPos ? 'trend-up' : 'trend-down'}`}>
          {isPos ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </span>
      </div>
      <div className="kpi-value-text">{value}</div>
      <div className="kpi-sub-text">{sub}</div>
      {mini.length > 1 && (
        <svg viewBox="0 0 100 30" className="kpi-sparkline" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polygon points={`0,30 ${pts} 100,30`} fill={`url(#sg${color.replace('#','')})`}/>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
function SectionHeader({ title, badge, action, onAction }) {
  return (
    <div className="sec-header">
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span className="sec-title">{title}</span>
        {badge && <span className="sec-badge">{badge}</span>}
      </div>
      {action && <button className="sec-action-btn" onClick={onAction}>{action}</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED H-BAR
// ═══════════════════════════════════════════════════════════════
function HBar({ name, cost, pct, color, icon, rank }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 150 + rank*70); return () => clearTimeout(t); }, [pct, rank]);
  return (
    <div className="hbar-row">
      <div className="hbar-meta">
        {icon && <span className="hbar-icon">{icon}</span>}
        <span className="hbar-name">{name}</span>
        <span className="hbar-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="hbar-track"><div className="hbar-fill" style={{ width:`${w}%`, background: color }}/></div>
      <span className="hbar-cost">{fmtK(cost)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANOMALY CARD
// ═══════════════════════════════════════════════════════════════
function AnomalyCard({ service, region, spike, cost, time, severity }) {
  const colors = { critical:"#EF4444", high:"#F59E0B", medium:"#8B5CF6" };
  const c = colors[severity] || "#64748B";
  return (
    <div className="anomaly-card" style={{'--sev': c}}>
      <div className="anomaly-pulse"/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontWeight:700, fontSize:14 }}>{service}</span>
        <span style={{ color:c, fontWeight:800, fontFamily:'monospace', fontSize:16 }}>{spike}</span>
      </div>
      <div style={{ display:'flex', gap:16, fontSize:12, color:'#94A3B8' }}>
        <span>{region}</span>
        <span style={{ color:'#F1F5F9', fontWeight:600, fontFamily:'monospace' }}>{cost}</span>
        <span>{time}</span>
      </div>
      <div style={{ height:2, background:'#1E293B', borderRadius:1, marginTop:12, overflow:'hidden' }}>
        <div className="anomaly-bar-fill" style={{ '--sev': c }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUDGET ROW
// ═══════════════════════════════════════════════════════════════
function BudgetRow({ name, budget, actual, forecast }) {
  const pct = Math.min((actual/budget)*100, 100);
  const fpct = Math.min((forecast/budget)*100, 100);
  const over = pct > 85;
  const [filled, setFilled] = useState(0);
  useEffect(() => { const t = setTimeout(() => setFilled(pct), 300); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="budget-row-inner">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontWeight:600, fontSize:13 }}>{name}</span>
        <span style={{ fontFamily:'monospace', fontSize:12 }}>
          <span style={{ color: over ? '#EF4444':'#10B981', fontWeight:700 }}>{fmtK(actual)}</span>
          <span style={{ color:'#475569' }}> / {fmtK(budget)}</span>
        </span>
      </div>
      <div style={{ height:6, background:'#1E293B', borderRadius:3, position:'relative', marginBottom:6 }}>
        <div style={{ height:'100%', width:`${filled}%`, background: over ? '#EF4444':'#2563EB', borderRadius:3, transition:'width 0.9s cubic-bezier(0.16,1,0.3,1)' }}/>
        <div style={{ position:'absolute', top:-3, left:`${fpct}%`, width:2, height:12, background:'#F59E0B', borderRadius:1, transform:'translateX(-50%)' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569' }}>
        <span>{pct.toFixed(1)}% used</span>
        <span style={{ color:'#F59E0B' }}>Forecast: {fmtK(forecast)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [isDark, setIsDark] = useState(true);
  const [timeGrain, setTimeGrain] = useState('monthly');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [filterSvc, setFilterSvc] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([{ role:'assistant', text:"Hi! I'm GenAI. Ask me anything about your cloud costs." }]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterSvcExplorer, setFilterSvcExplorer] = useState('All');

  // ===== COMPARISON MODE STATE =====
  const [compareMode, setCompareMode] = useState(false);
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
      setLoading(false);
    }, 80);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-lens-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => setLastUpdated(new Date()), 300000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  // ── Filtered data based on selected account ──
  const accountData = (data) => {
    if (selectedAccount === 'all') {
      return data.map(d => ({ ...d, total_cost: (d.prod_main || 0) + (d.prod_sec || 0) + (d.staging || 0) }));
    }
    const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
    const key = keyMap[selectedAccount] || 'prod_main';
    return data.map(d => ({ ...d, total_cost: d[key] || 0 }));
  };

  // ── Filtered service data ──
  const filteredServices = () => {
    let data = accountData(SERVICE_DATA);
    if (filterSvc !== 'all') {
      data = data.filter(d => d.service === filterSvc);
    }
    return data;
  };

  // ── Filtered region data ──
  const filteredRegions = () => {
    let data = accountData(REGION_DATA);
    if (filterRegion !== 'all') {
      data = data.filter(d => d.region === filterRegion);
    }
    return data;
  };

  // ── Filtered transactions ──
  const filteredTransactions = () => {
    let data = TRANSACTIONS;
    if (selectedAccount !== 'all') {
      data = data.filter(t => t.account === selectedAccount);
    }
    if (filterSvc !== 'all') {
      data = data.filter(t => t.service === filterSvc);
    }
    return data;
  };

  // ── Filtered monthly trend ──
  const filteredMonthlyTrend = () => {
    if (selectedAccount === 'all') {
      return MONTHLY_TREND.map(d => ({ month: d.month, total_cost: d.prod_main + d.prod_sec + d.staging }));
    }
    const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
    const key = keyMap[selectedAccount] || 'prod_main';
    return MONTHLY_TREND.map(d => ({ month: d.month, total_cost: d[key] }));
  };

  // ── Filtered hourly trend ──
  const filteredHourlyTrend = () => {
    if (selectedAccount === 'all') {
      return HOURLY_TREND.map(d => ({ hour: d.hour, cost: d.prod_main + d.prod_sec + d.staging }));
    }
    const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
    const key = keyMap[selectedAccount] || 'prod_main';
    return HOURLY_TREND.map(d => ({ hour: d.hour, cost: d[key] }));
  };

  // ── Filtered daily trend ──
  const filteredDailyTrend = () => {
    if (selectedAccount === 'all') {
      return DAILY_TREND.map(d => ({ day: d.day, total_cost: d.prod_main + d.prod_sec + d.staging }));
    }
    const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
    const key = keyMap[selectedAccount] || 'prod_main';
    return DAILY_TREND.map(d => ({ day: d.day, total_cost: d[key] }));
  };

  // ── Filtered data transfer ──
  const filteredDataTransfer = () => {
    if (selectedAccount === 'all') {
      return DATA_TRANSFER.map(d => ({ month: d.month, in: d.prod_main + d.prod_sec + d.staging }));
    }
    const keyMap = { 'prod-main': 'prod_main', 'prod-secondary': 'prod_sec', 'staging': 'staging' };
    const key = keyMap[selectedAccount] || 'prod_main';
    return DATA_TRANSFER.map(d => ({ month: d.month, in: d[key] }));
  };

  const trendData = timeGrain === 'hourly' ? filteredHourlyTrend()
                  : timeGrain === 'daily' ? filteredDailyTrend()
                  : filteredMonthlyTrend();
  const trendKey = timeGrain === 'hourly' ? 'hour'
                  : timeGrain === 'daily' ? 'day'
                  : 'month';
  const costKey = timeGrain === 'hourly' ? 'cost' : 'total_cost';

  const exportCSV = () => {
    const h = ["Date","Service","Account","Category","Amount"];
    const rows = filteredTransactions().map(t => [t.date, t.service, t.account, t.category, t.amount]);
    const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'genmanage_export.csv'; a.click();
  };
const API_BASE_URL = 'https://aws-billing-platform.onrender.com';

const fetchData = async () => {
  setLoading(true);
  try {
    // Fetch all data from the real backend
    const [summaryRes, monthlyRes, servicesRes, regionRes, currentMonthRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/billing/analytics/summary`),
      axios.get(`${API_BASE_URL}/billing/analytics/monthly-trend`),
      axios.get(`${API_BASE_URL}/billing/analytics/top-services?limit=5`),
      axios.get(`${API_BASE_URL}/billing/analytics/region-breakdown`),
      axios.get(`${API_BASE_URL}/billing/analytics/current-month`)
    ]);

    setSummary(summaryRes.data);
    setMonthlyTrend(monthlyRes.data);
    setTopServices(servicesRes.data);
    setRegionBreakdown(regionRes.data);
    setCurrentMonth(currentMonthRes.data);
    setLastUpdated(new Date());
  } catch (error) {
    console.error('Error fetching real data:', error);
    // Fallback to mock data if API fails
    setSummary(MOCK_DATA.summary);
    setMonthlyTrend(MOCK_DATA.monthly_trend);
    setTopServices(MOCK_DATA.top_services);
    setRegionBreakdown(MOCK_DATA.region_breakdown);
    setCurrentMonth(MOCK_DATA.current_month);
  }
  setLoading(false);
};
  const sendAI = () => {
    if (!aiInput.trim()) return;
    const q = aiInput; setAiInput('');
    setAiMessages(m => [...m, { role:'user', text:q }]);
    const replies = [
      "Your EC2 spend increased 23% MoM, driven by new instances in us-east-1.",
      "Based on usage, rightsizing 12 idle instances could save ~$14,200/month.",
      "Data transfer costs are trending +8% weekly — enabling optimization may help.",
      "Top cost driver: Compute at 33.3% of total spend."
    ];
    setTimeout(() => {
      setAiMessages(m => [...m, { role:'assistant', text: replies[Math.floor(Math.random()*replies.length)] }]);
    }, 700);
  };

  const svcExplorerCategories = ['All','Compute','Database','Storage','Networking','Analytics'];
  const totalSpent = ACCOUNTS.reduce((sum, a) => sum + a.total_cost, 0);
  const dailyAvg = totalSpent / 30;
  const forecast = totalSpent * 1.08;

  // ── Loading Skeletons ──
  if (loading) {
    return (
      <div className="lens-content" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '100%', width: '100%' }}>
        {/* KPI Cards Skeleton */}
        <div className="kpi-grid-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card" style={{ padding: '18px', opacity: 1, transform: 'none' }}>
              <Skeleton height={14} width={100} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
              <Skeleton height={28} width={120} style={{ marginTop: 8 }} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
              <Skeleton height={12} width={80} style={{ marginTop: 4 }} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
              <Skeleton height={30} style={{ marginTop: 10 }} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
            </div>
          ))}
        </div>

        {/* Main Chart Skeleton */}
        <div className="lens-card">
          <Skeleton height={20} width={150} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
          <Skeleton height={200} style={{ marginTop: 12 }} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
        </div>

        {/* Two-Column Skeletons */}
        <div className="grid-2col">
          <div className="lens-card">
            <Skeleton height={180} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
          </div>
          <div className="lens-card">
            <Skeleton height={180} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`lens-app ${loaded ? 'lens-loaded' : ''} ${isDark ? 'lens-dark' : 'lens-light'} ${sidebarOpen ? 'sidebar-is-open' : ''}`}>

      {/* ── Aurora ── */}
      <div className="lens-aurora" aria-hidden>
        <div className="aurora-blob a1"/><div className="aurora-blob a2"/><div className="aurora-blob a3"/>
      </div>

      {/* ── Sidebar ── */}
      <aside className={`lens-sidebar ${sidebarOpen ? 'sb-open' : 'sb-closed'}`}>
        <div className="sb-logo-row">
          <div className="sb-logo-mark">◈</div>
          {sidebarOpen && (
            <div className="sb-logo-text">
              <span className="sb-logo-name">GenManage</span>
              <span className="sb-logo-sub">Lens Analytics</span>
            </div>
          )}
        </div>

        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`sb-nav-item ${activeNav === item.id ? 'sb-active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="sb-nav-label">{item.label}</span>}
              {item.badge && sidebarOpen && <span className="sb-badge">{item.badge}</span>}
              {item.badge && !sidebarOpen && <span className="sb-badge-dot"/>}
            </button>
          ))}
        </nav>

        <div className="sb-footer">
          <button className="sb-footer-btn" onClick={() => setIsDark(d => !d)} title="Toggle theme">
            <span>{isDark ? '☀' : '☾'}</span>
            {sidebarOpen && <span className="sb-nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {sidebarOpen && (
            <div className="sb-account-row">
              <span className="sb-acct-dot"/>
              <div className="sb-acct-info">
                <span className="sb-acct-name">prod-main-account</span>
                <span className="sb-acct-id">841729384017</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="lens-main">

        {/* Topbar */}
        <header className="lens-topbar">
          <button className="topbar-hamburger" onClick={() => setSidebarOpen(s => !s)}>
            <span/><span/><span/>
          </button>
          <div className="topbar-breadcrumb">
            <span className="bc-root">Lens</span>
            <span className="bc-sep">›</span>
            <span className="bc-cur">{NAV_ITEMS.find(n => n.id === activeNav)?.label}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-meta">
              <span>🕐</span>
              <span>{lastUpdated.toLocaleTimeString()}</span>
              <button className="refresh-icon-btn" onClick={() => {
                setLastUpdated(new Date());
              }} title="Refresh">↺</button>
              <label className="auto-label">
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}/>
                Auto
              </label>
            </div>
            <button className="topbar-ai-btn" onClick={() => setAiOpen(true)}>
              <span className="ai-shimmer"/>✦ GenAI
            </button>
            <div className="topbar-avatar">PK</div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="lens-content">

          {/* ══════════ OVERVIEW ══════════ */}
          {activeNav === 'overview' && (
            <>
              {/* Account selector filter */}
              <div className="filter-bar-card">
                <div className="filter-bar-inner">
                  <div className="filter-group">
                    <label>Account</label>
                    <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="lens-select">
                      <option value="all">All Accounts</option>
                      {ACCOUNTS.map((a,i) => <option key={i} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Service</label>
                    <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)} className="lens-select">
                      <option value="all">All Services</option>
                      {SERVICE_DATA.map((s,i) => <option key={i} value={s.service}>{s.service}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Region</label>
                    <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="lens-select">
                      <option value="all">All Regions</option>
                      {REGION_DATA.map((r,i) => <option key={i} value={r.region}>{r.region}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="lens-select"/>
                  </div>
                  <div className="filter-group">
                    <label>To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="lens-select"/>
                  </div>
                  <button className="filter-apply-btn" onClick={() => {
                    fetchData();
                  }}>Apply</button>
                  <button className="filter-reset-btn" onClick={() => {
                    setSelectedAccount('all');
                    setFilterSvc('all');
                    setFilterRegion('all');
                    setStartDate('');
                    setEndDate('');
                    fetchData();
                  }}>Reset</button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="kpi-grid-4">
                <KPICard label="Total Cost" value={fmtK(totalSpent)} sub="All Accounts" trend={12.5} color="#2563EB" delay={0} sparkData={MONTHLY_TREND.map(d => d.prod_main + d.prod_sec + d.staging)} />
                <KPICard label="Daily Average" value={fmtK(dailyAvg)} sub="Last 30 days" trend={-3.2} color="#06B6D4" delay={80} sparkData={DAILY_TREND.map(d => d.prod_main + d.prod_sec + d.staging)} />
                <KPICard label="Month Forecast" value={fmtK(forecast)} sub="Projected EOM" trend={6.1} color="#8B5CF6" delay={160} sparkData={MONTHLY_TREND.map(d => d.prod_main + d.prod_sec + d.staging)} />
                <KPICard label="Savings Plans" value={fmtK(SAVINGS_PLANS.monthly_savings)} sub="Saved this month" trend={18.7} color="#10B981" delay={240} sparkData={[18000,22000,26000,29000,31000,34200]} />
              </div>

              {/* Cost Trend */}
              <div className="lens-card">
                <SectionHeader title="Cost Trend" badge="Live" action="Export CSV" onAction={exportCSV}/>
                <div className="view-toggle-row">
                  {['hourly','daily','monthly'].map(v => (
                    <button key={v} className={`view-toggle-btn ${timeGrain===v?'vt-active':''}`} onClick={() => setTimeGrain(v)}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>

                {/* === COMPARISON MODE UI === */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 8px', fontSize: '13px', color: '#94A3B8' }}>
                  <input type="checkbox" checked={compareMode} onChange={() => setCompareMode(!compareMode)} />
                  Enable Comparison
                </label>

                {compareMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Period 1</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="date" value={period1Start} onChange={e => setPeriod1Start(e.target.value)} className="lens-select" style={{ flex: 1 }} />
                        <input type="date" value={period1End} onChange={e => setPeriod1End(e.target.value)} className="lens-select" style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Period 2</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="date" value={period2Start} onChange={e => setPeriod2Start(e.target.value)} className="lens-select" style={{ flex: 1 }} />
                        <input type="date" value={period2End} onChange={e => setPeriod2End(e.target.value)} className="lens-select" style={{ flex: 1 }} />
                      </div>
                    </div>
                  </div>
                )}

                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trendData} margin={{top:4,right:4,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey={trendKey} tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Area type="monotone" dataKey={costKey} name="Actual" stroke="#2563EB" fill="url(#trendGrad)" strokeWidth={2}/>
                  </ComposedChart>
                </ResponsiveContainer>

                {/* === COMPARISON RESULTS === */}
                {compareMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px', padding: '16px', background: 'rgba(13,21,37,0.5)', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Period 1</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace' }}>$12,400</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Period 2</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace' }}>$14,200</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Difference</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace', color: '#22c55e' }}>+14.5%</div>
                    </div>
                  </div>
                )}

                {/* === FORECAST CHART === */}
                <div style={{ marginTop: '20px' }}>
                  <SectionHeader title="Cost Forecast" badge="Next 6 months" />
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[
                      { month: 'Jul', actual: 134200, forecast: 142000 },
                      { month: 'Aug', actual: 141000, forecast: 148000 },
                      { month: 'Sep', actual: null, forecast: 155000 },
                      { month: 'Oct', actual: null, forecast: 162000 },
                      { month: 'Nov', actual: null, forecast: 168000 },
                      { month: 'Dec', actual: null, forecast: 175000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => fmtK(v)} />
                      <Tooltip content={<DarkTooltip />} />
                      <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="forecast" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
                      <Legend formatter={v => <span style={{ fontSize: 11, color: '#94A3B8' }}>{v}</span>} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2-col: Services + Regions (filtered) */}
              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Service Breakdown" badge={`${filteredServices().length} services`}/>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={filteredServices()} cx="42%" cy="50%" innerRadius={52} outerRadius={82}
                        dataKey="total_cost" nameKey="service" paddingAngle={2}>
                        {filteredServices().map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip content={<DarkTooltip/>} formatter={(v) => fmtK(v)}/>
                      <Legend layout="vertical" align="right" verticalAlign="middle"
                        formatter={v => <span style={{fontSize:11,color:'#94A3B8'}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="lens-card">
                  <SectionHeader title="Region Breakdown"/>
                  <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:4}}>
                    {filteredRegions().map((r,i) => {
                      const maxR = Math.max(...accountData(REGION_DATA).map(d => d.total_cost));
                      return (
                        <HBar key={i} rank={i} name={r.region} cost={r.total_cost}
                          pct={(r.total_cost/maxR)*100} color={`hsl(${210+i*25},75%,${52+i*4}%)`}/>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2-col: Environment + Transactions */}
              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Environment Split"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={accountData(ENV_DATA)} cx="42%" cy="50%" innerRadius={48} outerRadius={78}
                        dataKey="total_cost" nameKey="environment" paddingAngle={3}>
                        {accountData(ENV_DATA).map((e,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Legend layout="vertical" align="right" verticalAlign="middle"
                        formatter={v => <span style={{fontSize:11,color:'#94A3B8'}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="lens-card">
                  <SectionHeader title="Recent Transactions" action="Export CSV" onAction={exportCSV}/>
                  <div className="table-wrap">
                    <table className="lens-table">
                      <thead><tr><th>Date</th><th>Service</th><th>Account</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
                      <tbody>
                        {filteredTransactions().slice(0,6).map(tx => (
                          <tr key={tx.id}>
                            <td className="td-mono">{tx.date}</td>
                            <td>{tx.service}</td>
                            <td className="td-dim">{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</td>
                            <td><span className={`cat-badge cat-${tx.category}`}>{tx.category}</span></td>
                            <td style={{textAlign:'right'}} className="td-mono td-cost">{fmtFull(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Data Transfer */}
              <div className="lens-card">
                <SectionHeader title="Data Transfer" badge="Network"/>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredDataTransfer()} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<DarkTooltip suffix="GB"/>}/>
                    <Line type="monotone" dataKey="in" name="Data Transfer" stroke="#2563EB" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Savings Plans Panel */}
              <div className="lens-card">
                <SectionHeader title="Savings Plans & Reserved Instances" badge="Optimization"/>
                <div className="savings-grid">
                  {[
                    { label:'Coverage', val:`${SAVINGS_PLANS.coverage}%` },
                    { label:'Utilization', val:`${SAVINGS_PLANS.utilization}%` },
                    { label:'Monthly Saved', val: fmtK(SAVINGS_PLANS.monthly_savings) },
                    { label:'Total Saved', val: fmtK(SAVINGS_PLANS.total_savings) },
                    { label:'Commitment', val: fmtK(SAVINGS_PLANS.commitment) },
                    { label:'Actual Usage', val: fmtK(SAVINGS_PLANS.actual) },
                  ].map((s,i) => (
                    <div key={i} className="savings-stat-card">
                      <span className="ss-label">{s.label}</span>
                      <strong className="ss-val">{s.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════ COST EXPLORER ══════════ */}
          {activeNav === 'explorer' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Cost Explorer</h2>
                <p className="page-sub">Drill down into your cloud spending across all dimensions.</p>
              </div>

              <div className="filter-bar-card">
                <div className="filter-bar-inner">
                  <div className="filter-group">
                    <label>Account</label>
                    <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="lens-select">
                      <option value="all">All Accounts</option>
                      {ACCOUNTS.map((a,i) => <option key={i} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Service</label>
                    <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)} className="lens-select">
                      <option value="all">All Services</option>
                      {SERVICE_DATA.map((s,i) => <option key={i} value={s.service}>{s.service}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Region</label>
                    <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="lens-select">
                      <option value="all">All Regions</option>
                      {REGION_DATA.map((r,i) => <option key={i} value={r.region}>{r.region}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="lens-select"/>
                  </div>
                  <div className="filter-group">
                    <label>To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="lens-select"/>
                  </div>
                  <button className="filter-apply-btn" onClick={() => {}}>Apply</button>
                  <button className="filter-reset-btn" onClick={() => {
                    setSelectedAccount('all');
                    setFilterSvc('all');
                    setFilterRegion('all');
                    setStartDate('');
                    setEndDate('');
                  }}>Reset</button>
                </div>
              </div>

              <div className="chip-row">
                {svcExplorerCategories.map(c => (
                  <button key={c} className={`chip ${filterSvcExplorer===c?'chip-active':''}`} onClick={() => setFilterSvcExplorer(c)}>{c}</button>
                ))}
              </div>

              <div className="lens-card">
                <SectionHeader title="Monthly Cost Breakdown" badge="12 months" action="Export CSV" onAction={exportCSV}/>
                <div className="view-toggle-row">
                  {['hourly','daily','monthly'].map(v => (
                    <button key={v} className={`view-toggle-btn ${timeGrain===v?'vt-active':''}`} onClick={() => setTimeGrain(v)}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={trendData} margin={{top:4,right:4,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey={trendKey} tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Area type="monotone" dataKey={costKey} name="Actual" stroke="#2563EB" fill="url(#expGrad)" strokeWidth={2}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Cost by Service" badge="breakdown"/>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={filteredServices()} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <YAxis dataKey="service" type="category" tick={{fontSize:10,fill:'#94A3B8'}} width={90} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" radius={[0,4,4,0]}>
                        {filteredServices().map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lens-card">
                  <SectionHeader title="Cost by Region" badge="geographic"/>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={filteredRegions()} margin={{top:0,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="region" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" radius={[4,4,0,0]}>
                        {filteredRegions().map((_,i) => <Cell key={i} fill={`hsl(${210+i*22},75%,${55+i*3}%)`}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Cost by Instance Type" badge="compute"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={accountData(INSTANCE_DATA)} margin={{top:0,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="instance" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" fill="#06B6D4" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lens-card">
                  <SectionHeader title="Top Projects" badge="by cost"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={accountData(PROJECT_DATA)} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <YAxis dataKey="project" type="category" tick={{fontSize:9,fill:'#94A3B8'}} width={110} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" fill="#8B5CF6" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lens-card">
                <SectionHeader title="Recent Transactions" badge="filtered" action="Export CSV" onAction={exportCSV}/>
                <div className="table-wrap">
                  <table className="lens-table">
                    <thead><tr><th>Date</th><th>Service</th><th>Account</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
                    <tbody>
                      {filteredTransactions().map(tx => (
                        <tr key={tx.id}>
                          <td className="td-mono">{tx.date}</td>
                          <td>{tx.service}</td>
                          <td className="td-dim">{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</td>
                          <td><span className={`cat-badge cat-${tx.category}`}>{tx.category}</span></td>
                          <td style={{textAlign:'right'}} className="td-mono td-cost">{fmtFull(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══════════ ANOMALIES ══════════ */}
          {activeNav === 'anomalies' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Anomaly Detection</h2>
                <p className="page-sub">ML-powered alerts for unusual cost spikes across your infrastructure.</p>
              </div>
              <div className="anom-stats-row">
                {[{label:'Critical',val:3,c:'#EF4444'},{label:'High',val:7,c:'#F59E0B'},{label:'Medium',val:12,c:'#8B5CF6'},{label:'Resolved',val:24,c:'#10B981'}].map((s,i) => (
                  <div key={i} className="lens-card anom-stat">
                    <span className="anom-stat-num" style={{color:s.c}}>{s.val}</span>
                    <span className="anom-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {ANOMALIES.map((a,i) => <AnomalyCard key={i} {...a}/>)}
              </div>
              <div className="lens-card">
                <SectionHeader title="Cost Anomaly Trend" badge="Last 30 days"/>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={DAILY_TREND.map((d,i) => ({...d, total_cost: d.prod_main + d.prod_sec + d.staging, anomaly: i===8 ? (d.prod_main + d.prod_sec + d.staging)*2.47 : i===18 ? (d.prod_main + d.prod_sec + d.staging)*1.34 : i===14 ? (d.prod_main + d.prod_sec + d.staging)*1.89 : 0}))}
                    margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="day" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="total_cost" name="Normal" fill="#1E293B" radius={[2,2,0,0]}/>
                    <Bar dataKey="anomaly" name="Anomaly" fill="#EF4444" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ══════════ BUDGETS ══════════ */}
          {activeNav === 'budgets' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Budget Tracker</h2>
                <p className="page-sub">Track spend against allocated budgets with real-time forecasting.</p>
              </div>
              <div className="lens-card">
                <SectionHeader title="Total Budget vs Actual" badge={`${BUDGET.percent_used.toFixed(1)}% used`}/>
                <div style={{margin:'12px 0 8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13}}>
                    <span>Budget: <strong>{fmtK(BUDGET.total_budget)}</strong></span>
                    <span>Spent: <strong style={{color: BUDGET.percent_used>85 ? '#EF4444':'#10B981'}}>{fmtK(BUDGET.spent)}</strong></span>
                    <span>Remaining: <strong>{fmtK(BUDGET.remaining)}</strong></span>
                  </div>
                  <div style={{height:10,background:'#1E293B',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${BUDGET.percent_used}%`,background:`linear-gradient(90deg,#10B981,#F59E0B,#EF4444)`,borderRadius:5,transition:'width 1s ease'}}/>
                  </div>
                </div>
              </div>
              {[
                {name:'Total Cloud', budget:300000, actual:BUDGET.spent, forecast:285000},
                {name:'Compute', budget:120000, actual:89420, forecast:98000},
                {name:'Database', budget:70000, actual:54180, forecast:62000},
                {name:'Storage', budget:50000, actual:38940, forecast:42000},
              ].map((b,i) => (
                <div key={i} className="lens-card"><BudgetRow {...b}/></div>
              ))}

              {/* Budget Alerts */}
              <div className="lens-card" style={{ marginTop: '16px', borderLeft: '4px solid #F59E0B' }}>
                <SectionHeader title="Budget Alerts" badge="2 active" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', borderLeft: '3px solid #F59E0B' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>⚠️ Budget Warning</div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>Compute budget is at 85% of allocated $120,000</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>$102,000 / $120,000</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', borderLeft: '3px solid #EF4444' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>🚨 Budget Exceeded</div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>Total Cloud budget exceeded by 4.8%</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>$314,200 / $300,000</div>
                  </div>
                </div>
              </div>

              <div className="lens-card">
                <SectionHeader title="Budget vs Actual — Monthly"/>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={MONTHLY_TREND.map(d => ({month: d.month, total_cost: d.prod_main + d.prod_sec + d.staging}))} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="total_cost" name="Actual" fill="#10B981" radius={[3,3,0,0]}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ══════════ SAVINGS ══════════ */}
          {activeNav === 'savings' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Savings Plans</h2>
                <p className="page-sub">RI and Savings Plans coverage, utilization, and optimization recommendations.</p>
              </div>
              <div className="kpi-grid-4">
                <KPICard label="Coverage" value={`${SAVINGS_PLANS.coverage}%`} sub="of eligible spend" trend={4.2} color="#10B981" delay={0}/>
                <KPICard label="Utilization" value={`${SAVINGS_PLANS.utilization}%`} sub="of committed" trend={1.8} color="#2563EB" delay={80}/>
                <KPICard label="Total Saved" value={fmtK(SAVINGS_PLANS.monthly_savings)} sub="This month" trend={18.7} color="#8B5CF6" delay={160}/>
                <KPICard label="On-Demand Waste" value={fmtK(12400)} sub="Uncovered spend" trend={-8.3} color="#EF4444" delay={240}/>
              </div>
              <div className="lens-card">
                <SectionHeader title="Coverage Over Time" badge="12 months"/>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={MONTHLY_TREND.map(d => ({...d, covered: (d.prod_main + d.prod_sec + d.staging)*0.685, uncovered: (d.prod_main + d.prod_sec + d.staging)*0.315}))}
                    margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Legend formatter={v=><span style={{fontSize:11,color:'#94A3B8'}}>{v}</span>}/>
                    <Bar dataKey="covered" name="Covered" fill="#10B981" stackId="a" radius={[0,0,0,0]}/>
                    <Bar dataKey="uncovered" name="Uncovered" fill="#EF4444" stackId="a" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ══════════ REPORTS ══════════ */}
          {activeNav === 'reports' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Reports</h2>
                <p className="page-sub">Generate, schedule, and export cost intelligence reports.</p>
              </div>
              <div className="reports-grid">
                {["Monthly Executive Summary","Service Cost Breakdown","Budget vs Actual","Anomaly Report","Savings Opportunities","Tag Compliance","Data Transfer Report","EC2 Right-Sizing","Environment Cost Split","YoY Cost Comparison"].map((r,i) => (
                  <div key={i} className="lens-card report-card-item">
                    <div className="report-icon-lg">▤</div>
                    <div className="report-card-name">{r}</div>
                    <div className="report-card-actions">
                      <button className="report-gen-btn" onClick={exportCSV}>Generate CSV</button>
                      <button className="report-sched-btn">Schedule</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══════════ SETTINGS ══════════ */}
          {activeNav === 'settings' && (
            <>
              <div className="page-hdr">
                <h2 className="page-title">Settings</h2>
                <p className="page-sub">Configure your account, integrations, and notification preferences.</p>
              </div>
              <div className="grid-2col">
                {[
                  {title:'AWS Integration',sub:'Connect your AWS accounts via IAM role.'},
                  {title:'Notifications', sub:'Set up cost alert thresholds and email digests.'},
                  {title:'Budget Alerts', sub:'Configure budget alert percentages.'},
                  {title:'Team Access', sub:'Manage role-based access control.'},
                ].map((s,i) => (
                  <div key={i} className="lens-card settings-card">
                    <div className="settings-title">{s.title}</div>
                    <div className="settings-sub">{s.sub}</div>
                    <button className="settings-configure-btn">Configure →</button>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>{/* /lens-content */}
      </div>{/* /lens-main */}

      {/* ══════════ LensGPT AI Chat ══════════ */}
      {aiOpen && (
        <div className="ai-overlay" onClick={e => e.target === e.currentTarget && setAiOpen(false)}>
          <div className="ai-panel">
            <div className="ai-panel-header">
              <div className="ai-panel-logo"><span className="ai-star">✦</span> GenAI</div>
              <button className="ai-close-btn" onClick={() => setAiOpen(false)}>✕</button>
            </div>
            <div className="ai-messages-area">
              {aiMessages.map((m,i) => (
                <div key={i} className={`ai-msg-row ${m.role}`}>
                  {m.role==='assistant' && <span className="ai-msg-star">✦</span>}
                  <div className="ai-msg-bubble">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="ai-input-row">
              <input className="ai-text-input" placeholder="Ask about your cloud costs…"
                value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && sendAI()}/>
              <button className="ai-send-btn" onClick={sendAI}>→</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}