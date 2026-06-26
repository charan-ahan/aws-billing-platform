import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area, AreaChart
} from 'recharts';
import './App.css';

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const MOCK_DATA = {
  summary: {
    total_cost: 268400.75,
    daily_avg: 8946.69,
    forecast: 285000.00,
    mom_change: 12.5,
    accounts: [
      { account: "prod-main-account", total_cost: 134200.38 },
      { account: "prod-secondary",    total_cost: 80520.23  },
      { account: "staging-account",   total_cost: 53680.14  }
    ]
  },
  service_breakdown: [
    { service: "Amazon EC2",        total_cost: 89420.50 },
    { service: "Amazon RDS",        total_cost: 54180.25 },
    { service: "Amazon S3",         total_cost: 38940.80 },
    { service: "CloudFront",        total_cost: 29310.20 },
    { service: "AWS Lambda",        total_cost: 21600.15 },
    { service: "Amazon EKS",        total_cost: 18720.45 },
    { service: "ElastiCache",       total_cost: 12450.30 },
    { service: "Others",            total_cost: 3778.10  }
  ],
  category_breakdown: [
    { category: "Compute",    total_cost: 89420, color: "#2563EB" },
    { category: "Database",   total_cost: 54180, color: "#8B5CF6" },
    { category: "Storage",    total_cost: 38940, color: "#06B6D4" },
    { category: "Networking", total_cost: 29310, color: "#10B981" },
    { category: "Analytics",  total_cost: 21600, color: "#F59E0B" },
    { category: "Other",      total_cost: 34950, color: "#64748B" }
  ],
  region_breakdown: [
    { region: "us-east-1",      total_cost: 112400 },
    { region: "us-west-2",      total_cost: 78300  },
    { region: "eu-west-1",      total_cost: 49200  },
    { region: "ap-south-1",     total_cost: 21100  },
    { region: "ap-southeast-1", total_cost: 7400   }
  ],
  instance_breakdown: [
    { instance: "t3.medium",  total_cost: 4528.50 },
    { instance: "t3.large",   total_cost: 3840.75 },
    { instance: "m5.large",   total_cost: 3250.20 },
    { instance: "c5.xlarge",  total_cost: 2680.80 },
    { instance: "r5.large",   total_cost: 1940.35 }
  ],
  data_transfer: [
    { month: "Jul", in: 1800, out: 3200, vpc: 1200 },
    { month: "Aug", in: 2100, out: 3800, vpc: 1400 },
    { month: "Sep", in: 1950, out: 3500, vpc: 1300 },
    { month: "Oct", in: 2300, out: 4200, vpc: 1600 },
    { month: "Nov", in: 2500, out: 4500, vpc: 1800 },
    { month: "Dec", in: 2800, out: 5000, vpc: 2000 },
    { month: "Jan", in: 3100, out: 5500, vpc: 2200 },
    { month: "Feb", in: 2900, out: 5200, vpc: 2100 },
    { month: "Mar", in: 3400, out: 6000, vpc: 2500 },
    { month: "Apr", in: 3600, out: 6500, vpc: 2800 },
    { month: "May", in: 4000, out: 7200, vpc: 3100 },
    { month: "Jun", in: 4500, out: 8000, vpc: 3500 }
  ],
  savings_plans: {
    coverage: 68.5,
    utilization: 72.3,
    monthly_savings: 34200,
    total_savings: 208400,
    commitment: 42000,
    actual: 31680
  },
  monthly_trend: [
    { month: "Jul '25", total_cost: 142300, forecast: 145000 },
    { month: "Aug '25", total_cost: 158700, forecast: 160000 },
    { month: "Sep '25", total_cost: 134200, forecast: 136000 },
    { month: "Oct '25", total_cost: 171500, forecast: 170000 },
    { month: "Nov '25", total_cost: 189200, forecast: 192000 },
    { month: "Dec '25", total_cost: 203400, forecast: 205000 },
    { month: "Jan '26", total_cost: 196800, forecast: 198000 },
    { month: "Feb '26", total_cost: 221300, forecast: 222000 },
    { month: "Mar '26", total_cost: 238900, forecast: 240000 },
    { month: "Apr '26", total_cost: 215600, forecast: 217000 },
    { month: "May '26", total_cost: 247100, forecast: 250000 },
    { month: "Jun '26", total_cost: 268400, forecast: 285000 }
  ],
  hourly_trend: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2,'0')}:00`,
    cost: i < 6 ? 120 + Math.sin(i)*80 : i < 12 ? 320 + Math.sin(i)*200 : i < 18 ? 480 + Math.sin(i)*180 : 260 + Math.sin(i)*140
  })),
  daily_trend: Array.from({ length: 30 }, (_, i) => ({
    day: `Jun ${i+1}`,
    total_cost: 6000 + Math.sin(i*0.4)*2000 + (i%3)*500,
    forecast:   6200 + Math.sin(i*0.4)*2100 + (i%3)*480
  })),
  top_projects: [
    { project: "E-Commerce Platform", total_cost: 84200.25 },
    { project: "Data Analytics Hub",  total_cost: 56340.50 },
    { project: "Mobile Backend",      total_cost: 42180.30 },
    { project: "ML Pipeline",         total_cost: 31720.45 },
    { project: "DevOps Infra",        total_cost: 21960.25 }
  ],
  environment_breakdown: [
    { environment: "Production",  total_cost: 178400, color: "#2563EB" },
    { environment: "Staging",     total_cost: 56200,  color: "#8B5CF6" },
    { environment: "Development", total_cost: 22400,  color: "#06B6D4" },
    { environment: "QA",          total_cost: 11400,  color: "#10B981" }
  ],
  anomalies: [
    { service: "EC2",    region: "us-east-1",  spike: "+247%", cost: "$12,400", time: "2h ago",  severity: "critical" },
    { service: "RDS",    region: "eu-west-1",  spike: "+89%",  cost: "$4,210",  time: "6h ago",  severity: "high"     },
    { service: "Lambda", region: "us-west-2",  spike: "+134%", cost: "$2,890",  time: "1d ago",  severity: "medium"   }
  ],
  transactions: [
    { id: 1,  date: "2026-06-25", service: "Amazon EC2",    account: "prod-main-account", amount: 2341.50, category: "Compute"    },
    { id: 2,  date: "2026-06-25", service: "Amazon RDS",    account: "prod-main-account", amount: 1876.20, category: "Database"   },
    { id: 3,  date: "2026-06-24", service: "Amazon S3",     account: "prod-secondary",    amount: 432.80,  category: "Storage"    },
    { id: 4,  date: "2026-06-24", service: "CloudFront",    account: "prod-main-account", amount: 891.40,  category: "Networking" },
    { id: 5,  date: "2026-06-23", service: "AWS Lambda",    account: "staging-account",   amount: 234.10,  category: "Compute"    },
    { id: 6,  date: "2026-06-23", service: "AWS Glue",      account: "prod-secondary",    amount: 567.50,  category: "Analytics"  },
    { id: 7,  date: "2026-06-22", service: "Amazon EC2",    account: "prod-main-account", amount: 3201.15, category: "Compute"    },
    { id: 8,  date: "2026-06-22", service: "Amazon S3",     account: "prod-main-account", amount: 928.80,  category: "Storage"    },
    { id: 9,  date: "2026-06-22", service: "Amazon Redshift", account: "prod-secondary",  amount: 2154.40, category: "Database"   },
    { id: 10, date: "2026-06-21", service: "AWS Lambda",    account: "prod-main-account", amount: 387.75,  category: "Compute"    }
  ],
  budget: {
    total_budget: 300000,
    spent: 268400,
    remaining: 31600,
    percent_used: 89.47
  }
};

const CATEGORY_COLORS = {
  Compute: "#2563EB", Database: "#8B5CF6", Storage: "#06B6D4",
  Networking: "#10B981", Analytics: "#F59E0B", Other: "#64748B"
};

const PIE_COLORS = ["#2563EB","#8B5CF6","#06B6D4","#10B981","#F59E0B","#EF4444","#EC4899","#64748B"];

const NAV_ITEMS = [
  { id: "overview",   label: "Overview",          icon: "◈" },
  { id: "explorer",   label: "Cost Explorer",      icon: "◎" },
  { id: "anomalies",  label: "Anomaly Detection",  icon: "◬", badge: 3 },
  { id: "budgets",    label: "Budget Tracker",     icon: "◉" },
  { id: "savings",    label: "Savings Plans",      icon: "◌" },
  { id: "reports",    label: "Reports",            icon: "▤" },
  { id: "settings",   label: "Settings",           icon: "⚙" }
];

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
const fmtK   = n => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${Number(n).toFixed(0)}`;
const fmtFull = n => `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

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
  const [loaded,       setLoaded]       = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeNav,    setActiveNav]    = useState('overview');
  const [isDark,       setIsDark]       = useState(true);
  const [timeGrain,    setTimeGrain]    = useState('monthly');
  const [filterAcct,   setFilterAcct]   = useState('all');
  const [filterSvc,    setFilterSvc]    = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [aiOpen,       setAiOpen]       = useState(false);
  const [aiInput,      setAiInput]      = useState('');
  const [aiMessages,   setAiMessages]   = useState([{ role:'assistant', text:"Hi! I'm LensGPT. Ask me anything about your AWS costs." }]);
  const [lastUpdated,  setLastUpdated]  = useState(new Date());
  const [autoRefresh,  setAutoRefresh]  = useState(false);
  const [filterSvcExplorer, setFilterSvcExplorer] = useState('All');

  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-lens-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => setLastUpdated(new Date()), 300000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  const { summary, service_breakdown, category_breakdown, region_breakdown,
          instance_breakdown, data_transfer, savings_plans, monthly_trend,
          hourly_trend, daily_trend, top_projects, environment_breakdown,
          anomalies, transactions, budget } = MOCK_DATA;

  const trendData = timeGrain === 'hourly' ? hourly_trend
                  : timeGrain === 'daily'   ? daily_trend
                  : monthly_trend;
  const trendKey  = timeGrain === 'hourly' ? 'hour'
                  : timeGrain === 'daily'   ? 'day'
                  : 'month';
  const costKey   = timeGrain === 'hourly' ? 'cost' : 'total_cost';

  const exportCSV = () => {
    const h = ["Date","Service","Account","Category","Amount"];
    const rows = transactions.map(t => [t.date, t.service, t.account, t.category, t.amount]);
    const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'cloudkeeper_export.csv'; a.click();
  };

  const sendAI = () => {
    if (!aiInput.trim()) return;
    const q = aiInput; setAiInput('');
    setAiMessages(m => [...m, { role:'user', text:q }]);
    const replies = [
      "Your EC2 spend increased 23% MoM, driven by new r6i instances in us-east-1.",
      "Based on usage, rightsizing 12 idle instances could save ~$14,200/month.",
      "S3 costs are trending +8% weekly — enabling Intelligent Tiering may help.",
      "Top cost driver: Compute at 33.3% of total spend ($89.4K this month)."
    ];
    setTimeout(() => {
      setAiMessages(m => [...m, { role:'assistant', text: replies[Math.floor(Math.random()*replies.length)] }]);
    }, 700);
  };

  const svcExplorerCategories = ['All','Compute','Database','Storage','Networking','Analytics'];
  const maxSvc = Math.max(...service_breakdown.map(s => s.total_cost));
  const maxReg = Math.max(...region_breakdown.map(r => r.total_cost));

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
              <span className="sb-logo-name">CloudKeeper</span>
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
              <button className="refresh-icon-btn" onClick={() => setLastUpdated(new Date())} title="Refresh">↺</button>
              <label className="auto-label">
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}/>
                Auto
              </label>
            </div>
            <button className="topbar-ai-btn" onClick={() => setAiOpen(true)}>
              <span className="ai-shimmer"/>✦ LensGPT
            </button>
            <div className="topbar-avatar">PK</div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="lens-content">

          {/* ══════════ OVERVIEW ══════════ */}
          {activeNav === 'overview' && (
            <>
              {/* KPI Grid */}
              <div className="kpi-grid-4">
                <KPICard label="Total Cost"     value={fmtK(summary.total_cost)} sub="Jun 2026"         trend={summary.mom_change} color="#2563EB" delay={0}   sparkData={monthly_trend.map(d=>d.total_cost)} />
                <KPICard label="Daily Average"  value={fmtK(summary.daily_avg)}  sub="Last 30 days"     trend={-3.2}               color="#06B6D4" delay={80}  sparkData={daily_trend.slice(-12).map(d=>d.total_cost)} />
                <KPICard label="Month Forecast" value={fmtK(summary.forecast)}   sub="Projected EOM"    trend={6.1}                color="#8B5CF6" delay={160} sparkData={monthly_trend.map(d=>d.forecast)} />
                <KPICard label="Savings Plans"  value={fmtK(savings_plans.monthly_savings)} sub="Saved this month" trend={18.7}   color="#10B981" delay={240} sparkData={[18000,22000,26000,29000,31000,34200]} />
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
                    {timeGrain !== 'hourly' && (
                      <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 2-col: Services + Regions */}
              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Service Breakdown" badge={`${service_breakdown.length} services`}/>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={service_breakdown} cx="42%" cy="50%" innerRadius={52} outerRadius={82}
                        dataKey="total_cost" nameKey="service" paddingAngle={2}>
                        {service_breakdown.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
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
                    {region_breakdown.map((r,i) => (
                      <HBar key={i} rank={i} name={r.region} cost={r.total_cost}
                        pct={(r.total_cost/maxReg)*100} color={`hsl(${210+i*25},75%,${52+i*4}%)`}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2-col: Environment + Transactions */}
              <div className="grid-2col">
                <div className="lens-card">
                  <SectionHeader title="Environment Split"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={environment_breakdown} cx="42%" cy="50%" innerRadius={48} outerRadius={78}
                        dataKey="total_cost" nameKey="environment" paddingAngle={3}>
                        {environment_breakdown.map((e,i) => <Cell key={i} fill={e.color}/>)}
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
                        {transactions.slice(0,6).map(tx => (
                          <tr key={tx.id}>
                            <td className="td-mono">{tx.date}</td>
                            <td>{tx.service}</td>
                            <td className="td-dim">{tx.account}</td>
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
                  <LineChart data={data_transfer} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<DarkTooltip suffix="GB"/>}/>
                    <Legend formatter={v => <span style={{fontSize:11,color:'#94A3B8'}}>{v}</span>}/>
                    <Line type="monotone" dataKey="in"  name="Data In"      stroke="#2563EB" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="out" name="Data Out"     stroke="#EF4444" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="vpc" name="VPC Transfer" stroke="#10B981" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Savings Plans Panel */}
              <div className="lens-card">
                <SectionHeader title="Savings Plans & Reserved Instances" badge="Optimization"/>
                <div className="savings-grid">
                  {[
                    { label:'Coverage',       val:`${savings_plans.coverage}%` },
                    { label:'Utilization',    val:`${savings_plans.utilization}%` },
                    { label:'Monthly Saved',  val: fmtK(savings_plans.monthly_savings) },
                    { label:'Total Saved',    val: fmtK(savings_plans.total_savings) },
                    { label:'Commitment',     val: fmtK(savings_plans.commitment) },
                    { label:'Actual Usage',   val: fmtK(savings_plans.actual) },
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
                <p className="page-sub">Drill down into your AWS spending across all dimensions.</p>
              </div>

              {/* Filter Bar */}
              <div className="filter-bar-card">
                <div className="filter-bar-inner">
                  <div className="filter-group">
                    <label>Account</label>
                    <select value={filterAcct} onChange={e => setFilterAcct(e.target.value)} className="lens-select">
                      <option value="all">All Accounts</option>
                      {summary.accounts.map((a,i) => <option key={i} value={a.account}>{a.account}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Service</label>
                    <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)} className="lens-select">
                      <option value="all">All Services</option>
                      {service_breakdown.map((s,i) => <option key={i} value={s.service}>{s.service}</option>)}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Region</label>
                    <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="lens-select">
                      <option value="all">All Regions</option>
                      {region_breakdown.map((r,i) => <option key={i} value={r.region}>{r.region}</option>)}
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
                  <button className="filter-apply-btn">Apply</button>
                  <button className="filter-reset-btn" onClick={() => {setFilterAcct('all');setFilterSvc('all');setFilterRegion('all');setStartDate('');setEndDate('');}}>Reset</button>
                </div>
              </div>

              {/* Category chips */}
              <div className="chip-row">
                {svcExplorerCategories.map(c => (
                  <button key={c} className={`chip ${filterSvcExplorer===c?'chip-active':''}`} onClick={() => setFilterSvcExplorer(c)}>{c}</button>
                ))}
              </div>

              {/* Monthly Trend full */}
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
                    {timeGrain !== 'hourly' && (
                      <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid-2col">
                {/* Service bar */}
                <div className="lens-card">
                  <SectionHeader title="Cost by Service" badge="breakdown"/>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={service_breakdown} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <YAxis dataKey="service" type="category" tick={{fontSize:10,fill:'#94A3B8'}} width={90} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" radius={[0,4,4,0]}>
                        {service_breakdown.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Region bar */}
                <div className="lens-card">
                  <SectionHeader title="Cost by Region" badge="geographic"/>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={region_breakdown} margin={{top:0,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="region" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" radius={[4,4,0,0]}>
                        {region_breakdown.map((_,i) => <Cell key={i} fill={`hsl(${210+i*22},75%,${55+i*3}%)`}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-2col">
                {/* Instance bar */}
                <div className="lens-card">
                  <SectionHeader title="Cost by Instance Type" badge="compute"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={instance_breakdown} margin={{top:0,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="instance" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" fill="#06B6D4" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Projects */}
                <div className="lens-card">
                  <SectionHeader title="Top Projects" badge="by cost"/>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={top_projects} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                      <YAxis dataKey="project" type="category" tick={{fontSize:9,fill:'#94A3B8'}} width={110} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DarkTooltip/>}/>
                      <Bar dataKey="total_cost" name="Cost" fill="#8B5CF6" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Full transactions table */}
              <div className="lens-card">
                <SectionHeader title="Recent Transactions" badge="last 10" action="Export CSV" onAction={exportCSV}/>
                <div className="table-wrap">
                  <table className="lens-table">
                    <thead><tr><th>Date</th><th>Service</th><th>Account</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="td-mono">{tx.date}</td>
                          <td>{tx.service}</td>
                          <td className="td-dim">{tx.account}</td>
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
                <p className="page-sub">ML-powered alerts for unusual cost spikes across your AWS infrastructure.</p>
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
                {anomalies.map((a,i) => <AnomalyCard key={i} {...a}/>)}
              </div>
              <div className="lens-card">
                <SectionHeader title="Cost Anomaly Trend" badge="Last 30 days"/>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daily_trend.map((d,i) => ({...d, anomaly: i===8?d.total_cost*2.47:i===18?d.total_cost*1.34:i===14?d.total_cost*1.89:0}))}
                    margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="day" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="total_cost" name="Normal"  fill="#1E293B" radius={[2,2,0,0]}/>
                    <Bar dataKey="anomaly"    name="Anomaly" fill="#EF4444" radius={[2,2,0,0]}/>
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
              {/* Overview budget bar */}
              <div className="lens-card">
                <SectionHeader title="Total Budget vs Actual" badge={`${budget.percent_used.toFixed(1)}% used`}/>
                <div style={{margin:'12px 0 8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13}}>
                    <span>Budget: <strong>{fmtK(budget.total_budget)}</strong></span>
                    <span>Spent: <strong style={{color: budget.percent_used>85 ? '#EF4444':'#10B981'}}>{fmtK(budget.spent)}</strong></span>
                    <span>Remaining: <strong>{fmtK(budget.remaining)}</strong></span>
                  </div>
                  <div style={{height:10,background:'#1E293B',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${budget.percent_used}%`,background:`linear-gradient(90deg,#10B981,#F59E0B,#EF4444)`,borderRadius:5,transition:'width 1s ease'}}/>
                  </div>
                </div>
              </div>
              {/* Per-category budgets */}
              {[
                {name:'Total Cloud',   budget:300000, actual:268400, forecast:285000},
                {name:'Compute',       budget:120000, actual:89420,  forecast:98000},
                {name:'Database',      budget:70000,  actual:54180,  forecast:62000},
                {name:'Storage',       budget:50000,  actual:38940,  forecast:42000},
                {name:'Networking',    budget:40000,  actual:29310,  forecast:34000},
              ].map((b,i) => (
                <div key={i} className="lens-card"><BudgetRow {...b}/></div>
              ))}
              <div className="lens-card">
                <SectionHeader title="Budget vs Actual — Monthly"/>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={monthly_trend} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="total_cost" name="Actual"   fill="#10B981" radius={[3,3,0,0]}/>
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 3" dot={false}/>
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
                <KPICard label="Coverage"         value={`${savings_plans.coverage}%`}       sub="of eligible spend" trend={4.2}  color="#10B981" delay={0}/>
                <KPICard label="Utilization"      value={`${savings_plans.utilization}%`}    sub="of committed"      trend={1.8}  color="#2563EB" delay={80}/>
                <KPICard label="Total Saved"      value={fmtK(savings_plans.monthly_savings)} sub="This month"       trend={18.7} color="#8B5CF6" delay={160}/>
                <KPICard label="On-Demand Waste"  value={fmtK(12400)}                         sub="Uncovered spend"  trend={-8.3} color="#EF4444" delay={240}/>
              </div>
              <div className="lens-card">
                <SectionHeader title="Coverage Over Time" badge="12 months"/>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly_trend.map(d => ({...d, covered: d.total_cost*0.685, uncovered: d.total_cost*0.315}))}
                    margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="month" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Legend formatter={v=><span style={{fontSize:11,color:'#94A3B8'}}>{v}</span>}/>
                    <Bar dataKey="covered"   name="Covered"   fill="#10B981" stackId="a" radius={[0,0,0,0]}/>
                    <Bar dataKey="uncovered" name="Uncovered" fill="#EF4444" stackId="a" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="lens-card">
                <SectionHeader title="Savings Plan Details"/>
                <div className="savings-grid">
                  {[
                    {label:'SP Coverage',      val:`${savings_plans.coverage}%`},
                    {label:'SP Utilization',   val:`${savings_plans.utilization}%`},
                    {label:'Monthly Savings',  val:fmtK(savings_plans.monthly_savings)},
                    {label:'Total Savings',    val:fmtK(savings_plans.total_savings)},
                    {label:'Commitment/mo',    val:fmtK(savings_plans.commitment)},
                    {label:'Actual Usage',     val:fmtK(savings_plans.actual)},
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
                  {title:'Notifications',  sub:'Set up cost alert thresholds and email digests.'},
                  {title:'Budget Alerts',  sub:'Configure budget alert percentages.'},
                  {title:'Team Access',    sub:'Manage role-based access control.'},
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
              <div className="ai-panel-logo"><span className="ai-star">✦</span> LensGPT</div>
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
              <input className="ai-text-input" placeholder="Ask about your AWS costs…"
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