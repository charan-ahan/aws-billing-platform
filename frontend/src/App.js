import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area
} from 'recharts';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './App.css';

// ── API URL ────────────────────────────────────────────────────────────
const API_BASE_URL = 'https://aws-billing-platform.onrender.com';

// ── Helpers ────────────────────────────────────────────────────────────
const formatCurrency = (v) => (v != null ? `$${Number(v).toFixed(2)}` : '$0.00');
const formatShort = (v) => {
  if (v == null) return '$0';
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

// ── Static mock data for features not yet available via API ──────────
const STATIC_SAVINGS = {
  coverage: 68.5,
  utilization: 72.3,
  monthly_savings: 34200,
  total_savings: 208400,
  commitment: 42000,
  actual: 31680
};
const STATIC_ANOMALIES = [
  { service: "EC2", region: "us-east-1", spike: "+247%", cost: "$12,400", time: "2h ago", severity: "critical" },
  { service: "RDS", region: "eu-west-1", spike: "+89%", cost: "$4,210", time: "6h ago", severity: "high" },
  { service: "Lambda", region: "us-west-2", spike: "+134%", cost: "$2,890", time: "1d ago", severity: "medium" }
];
const STATIC_BUDGETS = [
  { name: "Total Cloud", budget: 300000, actual: 268400, forecast: 285000 },
  { name: "Compute", budget: 120000, actual: 89420, forecast: 98000 },
  { name: "Database", budget: 70000, actual: 54180, forecast: 62000 },
  { name: "Storage", budget: 50000, actual: 38940, forecast: 42000 }
];
const STATIC_TRANSACTIONS = [
  { id: 1, date: "2026-06-25", service: "Amazon EC2", account: "prod-main", amount: 2341.50, category: "Compute" },
  { id: 2, date: "2026-06-25", service: "Amazon RDS", account: "prod-main", amount: 1876.20, category: "Database" },
  { id: 3, date: "2026-06-24", service: "Amazon S3", account: "prod-secondary", amount: 432.80, category: "Storage" },
  { id: 4, date: "2026-06-24", service: "CloudFront", account: "prod-main", amount: 891.40, category: "Networking" },
  { id: 5, date: "2026-06-23", service: "AWS Lambda", account: "staging", amount: 234.10, category: "Compute" }
];

// ── Dark Tooltip ───────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13,21,37,0.97)',
      border: '1px solid #1E293B',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: '#F1F5F9',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: p.color }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Error Boundary ─────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#EF4444', background: '#1E1E2F', minHeight: '100vh' }}>
          <h2>Something went wrong</h2>
          <pre style={{ color: '#F1F5F9' }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main App ──────────────────────────────────────────────────────────
function App() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [isDark, setIsDark] = useState(true);
  const [timeGrain, setTimeGrain] = useState('monthly');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Data states ──────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [regionBreakdown, setRegionBreakdown] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);

  // ── Filters ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  // ── Fetch real data ──────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [summaryRes, monthlyRes, servicesRes, regionRes, currentMonthRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/billing/analytics/summary${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/monthly-trend${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/top-services?limit=5${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/region-breakdown${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/current-month`)
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(monthlyRes.data || []);
      setTopServices(servicesRes.data || []);
      setRegionBreakdown(regionRes.data || []);
      setCurrentMonth(currentMonthRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Data fetch error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    document.documentElement.setAttribute('data-lens-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const applyFilters = () => fetchData();
  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    fetchData();
  };
  const exportCSV = () => alert('CSV export coming soon');

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="lens-content" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '100%', width: '100%' }}>
        <div className="kpi-grid-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card" style={{ padding: '18px', opacity: 1, transform: 'none' }}>
              <Skeleton height={14} width={100} baseColor={isDark ? '#1E293B' : '#E2E8F0'} highlightColor={isDark ? '#334155' : '#F1F5F9'} />
              <Skeleton height={28} width={120} style={{ marginTop: 8 }} />
              <Skeleton height={12} width={80} style={{ marginTop: 4 }} />
              <Skeleton height={30} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
        <div className="lens-card">
          <Skeleton height={20} width={150} />
          <Skeleton height={200} style={{ marginTop: 12 }} />
        </div>
        <div className="grid-2col">
          <div className="lens-card"><Skeleton height={180} /></div>
          <div className="lens-card"><Skeleton height={180} /></div>
        </div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
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
            <button className={`sb-nav-item ${activeNav === 'overview' ? 'sb-active' : ''}`} onClick={() => setActiveNav('overview')}>
              <span className="sb-nav-icon">◈</span>
              {sidebarOpen && <span className="sb-nav-label">Overview</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'explorer' ? 'sb-active' : ''}`} onClick={() => setActiveNav('explorer')}>
              <span className="sb-nav-icon">◎</span>
              {sidebarOpen && <span className="sb-nav-label">Cost Explorer</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'anomalies' ? 'sb-active' : ''}`} onClick={() => setActiveNav('anomalies')}>
              <span className="sb-nav-icon">◬</span>
              {sidebarOpen && <span className="sb-nav-label">Anomalies</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'budgets' ? 'sb-active' : ''}`} onClick={() => setActiveNav('budgets')}>
              <span className="sb-nav-icon">◉</span>
              {sidebarOpen && <span className="sb-nav-label">Budgets</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'savings' ? 'sb-active' : ''}`} onClick={() => setActiveNav('savings')}>
              <span className="sb-nav-icon">◌</span>
              {sidebarOpen && <span className="sb-nav-label">Savings</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'reports' ? 'sb-active' : ''}`} onClick={() => setActiveNav('reports')}>
              <span className="sb-nav-icon">▤</span>
              {sidebarOpen && <span className="sb-nav-label">Reports</span>}
            </button>
            <button className={`sb-nav-item ${activeNav === 'settings' ? 'sb-active' : ''}`} onClick={() => setActiveNav('settings')}>
              <span className="sb-nav-icon">⚙</span>
              {sidebarOpen && <span className="sb-nav-label">Settings</span>}
            </button>
          </nav>
          <div className="sb-footer">
            <button className="sb-footer-btn" onClick={() => setIsDark(!isDark)}>
              <span>{isDark ? '☀' : '☾'}</span>
              {sidebarOpen && <span className="sb-nav-label">{isDark ? 'Light' : 'Dark'}</span>}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="lens-main">

          {/* Topbar */}
          <header className="lens-topbar">
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span/><span/><span/>
            </button>
            <div className="topbar-breadcrumb">
              <span className="bc-root">Lens</span>
              <span className="bc-sep">›</span>
              <span className="bc-cur">{activeNav.charAt(0).toUpperCase()+activeNav.slice(1)}</span>
            </div>
            <div className="topbar-right">
              <div className="topbar-meta">
                <span>🕐</span>
                <span>{lastUpdated.toLocaleTimeString()}</span>
                <button className="refresh-icon-btn" onClick={fetchData} title="Refresh">↺</button>
                <label className="auto-label">
                  <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                  Auto
                </label>
              </div>
              <button className="topbar-ai-btn">✦ GenAI</button>
              <div className="topbar-avatar">PK</div>
            </div>
          </header>

          {/* Content */}
          <div className="lens-content">

            {/* ── Global Filter Bar ── */}
            <div className="filter-bar-card">
              <div className="filter-bar-inner">
                <div className="filter-group">
                  <label>Time Grain</label>
                  <select className="lens-select" value={timeGrain} onChange={e => setTimeGrain(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>From</label>
                  <input type="date" className="lens-select" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                </div>
                <div className="filter-group">
                  <label>To</label>
                  <input type="date" className="lens-select" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                </div>
                <button className="filter-apply-btn" onClick={applyFilters}>Apply</button>
                <button className="filter-reset-btn" onClick={resetFilters}>Reset</button>
                <button className="filter-apply-btn" style={{ background: '#22c55e' }} onClick={exportCSV}>CSV</button>
              </div>
            </div>

            {/* ── OVERVIEW PAGE ── */}
            {activeNav === 'overview' && (
              <>
                {/* KPI Cards */}
                <div className="kpi-grid-4">
                  <div className="kpi-card kpi-visible">
                    <div className="kpi-glow" style={{ '--kpi-color': '#2563EB' }} />
                    <div className="kpi-top-row">
                      <span className="kpi-label-text">Total Cost</span>
                      <span className="kpi-trend-pill trend-up">↑ 12.4%</span>
                    </div>
                    <div className="kpi-value-text">{summary ? formatShort(summary.total_cost) : '$0'}</div>
                    <div className="kpi-sub-text">Last 30 days</div>
                  </div>
                  <div className="kpi-card kpi-visible">
                    <div className="kpi-glow" style={{ '--kpi-color': '#06B6D4' }} />
                    <div className="kpi-top-row">
                      <span className="kpi-label-text">Daily Avg</span>
                      <span className="kpi-trend-pill trend-down">↓ 3.2%</span>
                    </div>
                    <div className="kpi-value-text">{summary ? formatShort(summary.total_cost / 30) : '$0'}</div>
                    <div className="kpi-sub-text">Per day</div>
                  </div>
                  <div className="kpi-card kpi-visible">
                    <div className="kpi-glow" style={{ '--kpi-color': '#8B5CF6' }} />
                    <div className="kpi-top-row">
                      <span className="kpi-label-text">Services</span>
                      <span className="kpi-trend-pill trend-up">↑ 6.1%</span>
                    </div>
                    <div className="kpi-value-text">{summary ? summary.service_count : '0'}</div>
                    <div className="kpi-sub-text">Active services</div>
                  </div>
                  <div className="kpi-card kpi-visible">
                    <div className="kpi-glow" style={{ '--kpi-color': '#10B981' }} />
                    <div className="kpi-top-row">
                      <span className="kpi-label-text">This Month</span>
                      <span className="kpi-trend-pill trend-up">↑ 18.7%</span>
                    </div>
                    <div className="kpi-value-text">{currentMonth ? formatShort(currentMonth.current_month_cost) : '$0'}</div>
                    <div className="kpi-sub-text">{currentMonth ? `${currentMonth.change_percent?.toFixed(1) || 0}% vs last` : ''}</div>
                  </div>
                </div>

                {/* Cost Trend Chart */}
                <div className="lens-card">
                  <div className="sec-header">
                    <span className="sec-title">Cost Trend</span>
                    <span className="sec-badge">Live</span>
                  </div>
                  <div className="view-toggle-row">
                    {['hourly','daily','monthly'].map(v => (
                      <button key={v} className={`view-toggle-btn ${timeGrain===v?'vt-active':''}`} onClick={() => setTimeGrain(v)}>
                        {v.charAt(0).toUpperCase()+v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => formatShort(v)} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area type="monotone" dataKey="total_cost" stroke="#2563EB" fill="url(#trendGrad)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Services & Regions */}
                <div className="grid-2col">
                  <div className="lens-card">
                    <div className="sec-header">
                      <span className="sec-title">Top Services</span>
                      <span className="sec-badge">by cost</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topServices} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => formatShort(v)} />
                        <YAxis dataKey="service" type="category" tick={{ fontSize: 10, fill: '#94A3B8' }} width={100} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="lens-card">
                    <div className="sec-header">
                      <span className="sec-title">Region Breakdown</span>
                      <span className="sec-badge">geographic</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={regionBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => formatShort(v)} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="total_cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Environment Breakdown & Data Transfer (mock) */}
                <div className="grid-2col">
                  <div className="lens-card">
                    <div className="sec-header">
                      <span className="sec-title">Environment</span>
                      <span className="sec-badge">breakdown</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={[
                          { name: "Production", value: 178400, color: "#2563EB" },
                          { name: "Staging", value: 56200, color: "#8B5CF6" },
                          { name: "Development", value: 22400, color: "#06B6D4" },
                          { name: "QA", value: 11400, color: "#10B981" }
                        ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({name, value}) => `${name}: $${(value/1000).toFixed(0)}K`} labelLine={false}>
                          <Cell fill="#2563EB" /><Cell fill="#8B5CF6" /><Cell fill="#06B6D4" /><Cell fill="#10B981" />
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="lens-card">
                    <div className="sec-header">
                      <span className="sec-title">Data Transfer</span>
                      <span className="sec-badge">network</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={[
                        { month: 'Jun', in: 4500, out: 8000, vpc: 3500 },
                        { month: 'Jul', in: 4200, out: 7200, vpc: 3100 },
                        { month: 'Aug', in: 4000, out: 6500, vpc: 2800 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="in" stroke="#3b82f6" name="Data In" />
                        <Line type="monotone" dataKey="out" stroke="#ef4444" name="Data Out" />
                        <Line type="monotone" dataKey="vpc" stroke="#22c55e" name="VPC Transfer" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Savings Plans Panel (static mock) */}
                <div className="lens-card">
                  <div className="sec-header">
                    <span className="sec-title">Savings Plans & RI</span>
                    <span className="sec-badge">optimization</span>
                  </div>
                  <div className="savings-grid">
                    {[
                      { label:'Coverage', val:`${STATIC_SAVINGS.coverage}%` },
                      { label:'Utilization', val:`${STATIC_SAVINGS.utilization}%` },
                      { label:'Monthly Saved', val: formatShort(STATIC_SAVINGS.monthly_savings) },
                      { label:'Total Saved', val: formatShort(STATIC_SAVINGS.total_savings) },
                      { label:'Commitment', val: formatShort(STATIC_SAVINGS.commitment) },
                      { label:'Actual Usage', val: formatShort(STATIC_SAVINGS.actual) }
                    ].map((s,i) => (
                      <div key={i} className="savings-stat-card">
                        <span className="ss-label">{s.label}</span>
                        <strong className="ss-val">{s.val}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions (static mock) */}
                <div className="lens-card">
                  <div className="sec-header">
                    <span className="sec-title">Recent Transactions</span>
                    <span className="sec-badge">last 5</span>
                  </div>
                  <div className="table-wrap">
                    <table className="lens-table">
                      <thead><tr><th>Date</th><th>Service</th><th>Account</th><th>Category</th><th>Amount</th></tr></thead>
                      <tbody>
                        {STATIC_TRANSACTIONS.map(tx => (
                          <tr key={tx.id}>
                            <td>{tx.date}</td>
                            <td>{tx.service}</td>
                            <td>{tx.account}</td>
                            <td><span className={`cat-badge cat-${tx.category}`}>{tx.category}</span></td>
                            <td>{formatCurrency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── COST EXPLORER PAGE ── */}
            {activeNav === 'explorer' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Cost Explorer</h2>
                  <p className="page-sub">Drill down into your cloud spending across all dimensions.</p>
                </div>
                <div className="lens-card">
                  <div className="sec-header">
                    <span className="sec-title">Monthly Cost Breakdown</span>
                    <span className="sec-badge">12 months</span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={v => formatShort(v)} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="total_cost" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid-2col">
                  <div className="lens-card">
                    <div className="sec-header"><span className="sec-title">Top Services</span></div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topServices} layout="vertical">
                        <XAxis type="number" tickFormatter={v => formatShort(v)} />
                        <YAxis dataKey="service" type="category" width={100} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="total_cost" fill="#3b82f6" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lens-card">
                    <div className="sec-header"><span className="sec-title">Region Breakdown</span></div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={regionBreakdown}>
                        <XAxis dataKey="region" />
                        <YAxis tickFormatter={v => formatShort(v)} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="total_cost" fill="#8b5cf6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* ── ANOMALIES PAGE ── */}
            {activeNav === 'anomalies' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Anomaly Detection</h2>
                  <p className="page-sub">ML-powered alerts for unusual cost spikes.</p>
                </div>
                <div className="anom-stats-row">
                  {[{label:'Critical',val:3,c:'#EF4444'},{label:'High',val:7,c:'#F59E0B'},{label:'Medium',val:12,c:'#8B5CF6'},{label:'Resolved',val:24,c:'#10B981'}].map((s,i) => (
                    <div key={i} className="lens-card anom-stat">
                      <span className="anom-stat-num" style={{color:s.c}}>{s.val}</span>
                      <span className="anom-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {STATIC_ANOMALIES.map((a,i) => (
                    <div key={i} className="anomaly-card" style={{'--sev': a.severity==='critical'?'#EF4444':a.severity==='high'?'#F59E0B':'#8B5CF6'}}>
                      <div className="anomaly-pulse" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{a.service}</span>
                        <span style={{ color: '#EF4444', fontWeight: 800, fontFamily: 'monospace' }}>{a.spike}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94A3B8' }}>
                        <span>{a.region}</span>
                        <span>{a.cost}</span>
                        <span>{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── BUDGETS PAGE ── */}
            {activeNav === 'budgets' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Budget Tracker</h2>
                  <p className="page-sub">Track spend against allocated budgets.</p>
                </div>
                <div className="lens-card">
                  <div className="sec-header">
                    <span className="sec-title">Budget Overview</span>
                    <span className="sec-badge">{((BUDGET_TOTAL_ACTUAL/BUDGET_TOTAL_BUDGET)*100).toFixed(1)}% used</span>
                  </div>
                  {/* Budget summary bar */}
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Budget: ${(BUDGET_TOTAL_BUDGET/1000).toFixed(0)}K</span>
                      <span>Actual: ${(BUDGET_TOTAL_ACTUAL/1000).toFixed(0)}K</span>
                      <span>Remaining: ${((BUDGET_TOTAL_BUDGET-BUDGET_TOTAL_ACTUAL)/1000).toFixed(0)}K</span>
                    </div>
                    <div style={{ height: 8, background: '#1E293B', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(BUDGET_TOTAL_ACTUAL/BUDGET_TOTAL_BUDGET)*100}%`, background: `linear-gradient(90deg,#10B981,#F59E0B,#EF4444)`, borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
                {STATIC_BUDGETS.map((b,i) => {
                  const pct = (b.actual/b.budget)*100;
                  return (
                    <div key={i} className="lens-card">
                      <div className="budget-row-inner">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            <span style={{ color: pct>85?'#EF4444':'#10B981', fontWeight: 700 }}>{formatShort(b.actual)}</span>
                            <span style={{ color: '#475569' }}> / {formatShort(b.budget)}</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: '#1E293B', borderRadius: 3, position: 'relative' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct,100)}%`, background: pct>85?'#EF4444':'#2563EB', borderRadius: 3, transition: 'width 0.6s ease' }} />
                          <div style={{ position: 'absolute', top: -4, left: `${Math.min((b.forecast/b.budget)*100,100)}%`, width: 2, height: 12, background: '#F59E0B', borderRadius: 1, transform: 'translateX(-50%)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                          <span>{pct.toFixed(1)}% used</span>
                          <span style={{ color: '#F59E0B' }}>Forecast: {formatShort(b.forecast)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── SAVINGS PAGE ── */}
            {activeNav === 'savings' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Savings Plans</h2>
                  <p className="page-sub">RI and Savings Plans coverage, utilization, and optimization.</p>
                </div>
                <div className="kpi-grid-4">
                  <KPICard label="Coverage" value={`${STATIC_SAVINGS.coverage}%`} sub="of eligible spend" trend={4.2} color="#10B981" delay={0} />
                  <KPICard label="Utilization" value={`${STATIC_SAVINGS.utilization}%`} sub="of committed" trend={1.8} color="#2563EB" delay={80} />
                  <KPICard label="Total Saved" value={formatShort(STATIC_SAVINGS.monthly_savings)} sub="This month" trend={18.7} color="#8B5CF6" delay={160} />
                  <KPICard label="On-Demand Waste" value={formatShort(12400)} sub="Uncovered spend" trend={-8.3} color="#EF4444" delay={240} />
                </div>
                <div className="lens-card">
                  <div className="sec-header"><span className="sec-title">Coverage Over Time</span></div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyTrend.map(d => ({ month: d.month, covered: d.total_cost*0.685, uncovered: d.total_cost*0.315 }))}>
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={v => formatShort(v)} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="covered" name="Covered" fill="#10B981" stackId="a" />
                      <Bar dataKey="uncovered" name="Uncovered" fill="#EF4444" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── REPORTS PAGE ── */}
            {activeNav === 'reports' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Reports</h2>
                  <p className="page-sub">Generate and export cost intelligence reports.</p>
                </div>
                <div className="reports-grid">
                  {["Monthly Executive Summary","Service Cost Breakdown","Budget vs Actual","Anomaly Report","Savings Opportunities","Tag Compliance"].map((r,i) => (
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

            {/* ── SETTINGS PAGE ── */}
            {activeNav === 'settings' && (
              <>
                <div className="page-hdr">
                  <h2 className="page-title">Settings</h2>
                  <p className="page-sub">Configure your account, integrations, and notifications.</p>
                </div>
                <div className="grid-2col">
                  {[
                    {title:'AWS Integration',sub:'Connect your AWS accounts via IAM role.'},
                    {title:'Notifications', sub:'Set up cost alert thresholds and email digests.'},
                    {title:'Budget Alerts', sub:'Configure budget alert percentages.'},
                    {title:'Team Access', sub:'Manage role-based access control.'}
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
      </div>
    </ErrorBoundary>
  );
}

// ── Reusable KPI Card ──────────────────────────────────────────────────
function KPICard({ label, value, sub, trend, color="#2563EB", delay=0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isPos = trend > 0;
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
    </div>
  );
}

// ── Static budget totals for summary bar ─────────────────────────────
const BUDGET_TOTAL_BUDGET = 300000;
const BUDGET_TOTAL_ACTUAL = 268400;

export default App;