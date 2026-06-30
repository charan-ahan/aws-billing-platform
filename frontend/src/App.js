import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Cell
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
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Data states ──────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [regionBreakdown, setRegionBreakdown] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);

  // ── Filter states ────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    timeGrain: 'monthly',
    startDate: '',
    endDate: ''
  });

  // ── Fetch Data ──────────────────────────────────────────────────────
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
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const applyFilters = () => fetchData();
  const resetFilters = () => {
    setFilters({ timeGrain: 'monthly', startDate: '', endDate: '' });
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
      <div className={`lens-app ${isDark ? 'lens-dark' : 'lens-light'} ${sidebarOpen ? 'sidebar-is-open' : ''}`}>

        {/* ── Sidebar ── */}
        <aside className={`lens-sidebar ${sidebarOpen ? 'sb-open' : 'sb-closed'}`}>
          <div className="sb-logo-row">
            <div className="sb-logo-mark">◈</div>
            {sidebarOpen && (
              <div className="sb-logo-text">
                <span className="sb-logo-name">FinOps</span>
                <span className="sb-logo-sub">GenManage</span>
              </div>
            )}
          </div>
          <nav className="sb-nav">
            <button className="sb-nav-item sb-active">
              <span className="sb-nav-icon">📊</span>
              {sidebarOpen && <span className="sb-nav-label">Dashboard</span>}
            </button>
            <button className="sb-nav-item">
              <span className="sb-nav-icon">◎</span>
              {sidebarOpen && <span className="sb-nav-label">Explorer</span>}
            </button>
            <button className="sb-nav-item">
              <span className="sb-nav-icon">▤</span>
              {sidebarOpen && <span className="sb-nav-label">Reports</span>}
            </button>
            <button className="sb-nav-item">
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
              <span className="bc-cur">Dashboard</span>
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

            {/* ── Filter Bar ── */}
            <div className="filter-bar-card">
              <div className="filter-bar-inner">
                <div className="filter-group">
                  <label>Time Grain</label>
                  <select className="lens-select" value={filters.timeGrain} onChange={e => handleFilterChange('timeGrain', e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>From</label>
                  <input type="date" className="lens-select" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                </div>
                <div className="filter-group">
                  <label>To</label>
                  <input type="date" className="lens-select" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                </div>
                <button className="filter-apply-btn" onClick={applyFilters}>Apply</button>
                <button className="filter-reset-btn" onClick={resetFilters}>Reset</button>
                <button className="filter-apply-btn" style={{ background: '#22c55e' }} onClick={exportCSV}>CSV</button>
              </div>
            </div>

            {/* ── KPI Cards ── */}
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

            {/* ── Cost Trend ── */}
            <div className="lens-card">
              <div className="sec-header">
                <span className="sec-title">Cost Trend</span>
                <span className="sec-badge">Live</span>
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

            {/* ── Two columns: Services & Regions ── */}
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

          </div>{/* /lens-content */}
        </div>{/* /lens-main */}
      </div>
    </ErrorBoundary>
  );
}

export default App;