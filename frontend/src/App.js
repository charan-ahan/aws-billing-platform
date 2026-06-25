import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import SkeletonLoader from './SkeletonLoader';

const API_BASE_URL = 'https://aws-billing-platform.onrender.com';

// ===== COMPREHENSIVE MOCK DATA =====
const MOCK_DATA = {
  summary: {
    total_records: 15420,
    total_cost: 45280.75,
    average_cost: 36.22,
    daily_avg: 1509.36,
    forecast: 48750.00,
    mom_change: 12.5,
    accounts: [
      { account: "Prod-Account-1", total_cost: 22640.38 },
      { account: "Prod-Account-2", total_cost: 13584.23 },
      { account: "Staging-Account", total_cost: 9056.15 }
    ]
  },
  service_breakdown: [
    { service: "Amazon EC2", total_cost: 15240.50 },
    { service: "Amazon S3", total_cost: 8760.25 },
    { service: "AWS Lambda", total_cost: 6230.80 },
    { service: "Amazon RDS", total_cost: 5140.20 },
    { service: "Amazon VPC", total_cost: 3870.15 },
    { service: "AWS Glue", total_cost: 2890.45 },
    { service: "Amazon Redshift", total_cost: 2140.30 },
    { service: "Amazon CloudFront", total_cost: 1008.10 }
  ],
  category_breakdown: [
    { category: "Compute", total_cost: 21471.30 },
    { category: "Storage", total_cost: 10860.40 },
    { category: "Database", total_cost: 7280.50 },
    { category: "Networking", total_cost: 4878.25 },
    { category: "Analytics", total_cost: 2890.45 },
    { category: "Other", total_cost: 1900.85 }
  ],
  region_breakdown: [
    { region: "us-east-1", total_cost: 15848.26 },
    { region: "us-west-2", total_cost: 12679.31 },
    { region: "eu-west-1", total_cost: 9056.15 },
    { region: "ap-southeast-1", total_cost: 7696.03 }
  ],
  instance_breakdown: [
    { instance: "t3.medium", total_cost: 4528.50 },
    { instance: "t3.large", total_cost: 3840.75 },
    { instance: "m5.large", total_cost: 3250.20 },
    { instance: "c5.xlarge", total_cost: 2680.80 },
    { instance: "r5.large", total_cost: 1940.35 }
  ],
  data_transfer: [
    { month: "2025-07", in: 1800, out: 3200, vpc: 1200 },
    { month: "2025-08", in: 2100, out: 3800, vpc: 1400 },
    { month: "2025-09", in: 1950, out: 3500, vpc: 1300 },
    { month: "2025-10", in: 2300, out: 4200, vpc: 1600 },
    { month: "2025-11", in: 2500, out: 4500, vpc: 1800 },
    { month: "2025-12", in: 2800, out: 5000, vpc: 2000 },
    { month: "2026-01", in: 3100, out: 5500, vpc: 2200 },
    { month: "2026-02", in: 2900, out: 5200, vpc: 2100 },
    { month: "2026-03", in: 3400, out: 6000, vpc: 2500 },
    { month: "2026-04", in: 3600, out: 6500, vpc: 2800 },
    { month: "2026-05", in: 4000, out: 7200, vpc: 3100 },
    { month: "2026-06", in: 4500, out: 8000, vpc: 3500 }
  ],
  savings_plans: {
    coverage: 68.5,
    utilization: 72.3,
    monthly_savings: 1840,
    total_savings: 22100,
    commitment: 3520,
    actual: 2680
  },
  monthly_trend: [
    { month: "2025-07", total_cost: 3520.50 },
    { month: "2025-08", total_cost: 4120.75 },
    { month: "2025-09", total_cost: 3840.20 },
    { month: "2025-10", total_cost: 4560.80 },
    { month: "2025-11", total_cost: 4980.15 },
    { month: "2025-12", total_cost: 5320.40 },
    { month: "2026-01", total_cost: 5680.90 },
    { month: "2026-02", total_cost: 5120.30 },
    { month: "2026-03", total_cost: 6240.60 },
    { month: "2026-04", total_cost: 6720.25 },
    { month: "2026-05", total_cost: 7110.80 },
    { month: "2026-06", total_cost: 7640.50 }
  ],
  hourly_trend: [
    { hour: "00:00", cost: 215.50 },
    { hour: "01:00", cost: 185.20 },
    { hour: "02:00", cost: 152.80 },
    { hour: "03:00", cost: 135.40 },
    { hour: "04:00", cost: 145.60 },
    { hour: "05:00", cost: 168.30 },
    { hour: "06:00", cost: 220.70 },
    { hour: "07:00", cost: 310.50 },
    { hour: "08:00", cost: 395.80 },
    { hour: "09:00", cost: 450.20 },
    { hour: "10:00", cost: 480.60 },
    { hour: "11:00", cost: 520.30 },
    { hour: "12:00", cost: 485.70 },
    { hour: "13:00", cost: 430.40 },
    { hour: "14:00", cost: 490.80 },
    { hour: "15:00", cost: 540.20 },
    { hour: "16:00", cost: 580.60 },
    { hour: "17:00", cost: 610.30 },
    { hour: "18:00", cost: 550.80 },
    { hour: "19:00", cost: 480.20 },
    { hour: "20:00", cost: 410.60 },
    { hour: "21:00", cost: 350.30 },
    { hour: "22:00", cost: 280.80 },
    { hour: "23:00", cost: 240.20 }
  ],
  top_services: [
    { service: "Amazon EC2", total_cost: 15240.50 },
    { service: "Amazon S3", total_cost: 8760.25 },
    { service: "AWS Lambda", total_cost: 6230.80 },
    { service: "Amazon RDS", total_cost: 5140.20 },
    { service: "Amazon VPC", total_cost: 3870.15 }
  ],
  top_projects: [
    { project: "E-commerce Platform", total_cost: 16840.25 },
    { project: "Data Analytics", total_cost: 11240.50 },
    { project: "Mobile Backend", total_cost: 8950.30 },
    { project: "ML Pipeline", total_cost: 6720.45 },
    { project: "DevOps Tools", total_cost: 4529.25 }
  ],
  environment_breakdown: [
    { environment: "Production", total_cost: 27168.45 },
    { environment: "Staging", total_cost: 11320.19 },
    { environment: "Development", total_cost: 6792.11 }
  ],
  transactions: [
    { id: 1, date: "2026-06-24", service: "Amazon EC2", account: "Prod-Account-1", amount: 245.80, category: "Compute" },
    { id: 2, date: "2026-06-24", service: "Amazon S3", account: "Prod-Account-1", amount: 85.60, category: "Storage" },
    { id: 3, date: "2026-06-24", service: "AWS Lambda", account: "Prod-Account-2", amount: 42.30, category: "Compute" },
    { id: 4, date: "2026-06-23", service: "Amazon RDS", account: "Prod-Account-1", amount: 128.90, category: "Database" },
    { id: 5, date: "2026-06-23", service: "Amazon VPC", account: "Staging-Account", amount: 36.20, category: "Networking" },
    { id: 6, date: "2026-06-23", service: "AWS Glue", account: "Prod-Account-2", amount: 67.50, category: "Analytics" },
    { id: 7, date: "2026-06-22", service: "Amazon EC2", account: "Prod-Account-1", amount: 320.15, category: "Compute" },
    { id: 8, date: "2026-06-22", service: "Amazon S3", account: "Prod-Account-1", amount: 92.80, category: "Storage" },
    { id: 9, date: "2026-06-22", service: "Amazon Redshift", account: "Prod-Account-2", amount: 215.40, category: "Database" },
    { id: 10, date: "2026-06-21", service: "AWS Lambda", account: "Prod-Account-1", amount: 38.75, category: "Compute" }
  ],
  budget: {
    total_budget: 60000,
    spent: 45280.75,
    remaining: 14719.25,
    percent_used: 75.47
  }
};

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#e0e7ff'];

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [isDark, setIsDark] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [filters, setFilters] = useState({
    account: 'all',
    service: 'all',
    region: 'all',
    timeGrain: 'monthly',
    startDate: '',
    endDate: ''
  });

  const [summary, setSummary] = useState(null);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [regionBreakdown, setRegionBreakdown] = useState([]);
  const [instanceBreakdown, setInstanceBreakdown] = useState([]);
  const [dataTransfer, setDataTransfer] = useState([]);
  const [savingsPlans, setSavingsPlans] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [hourlyTrend, setHourlyTrend] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [environmentBreakdown, setEnvironmentBreakdown] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budget, setBudget] = useState(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    toast.info(`Switched to ${isDark ? 'Light' : 'Dark'} mode`);
  };

 const fetchData = async () => {
  setLoading(true);
  try {
    setSummary(MOCK_DATA.summary);
    setServiceBreakdown(MOCK_DATA.service_breakdown);
    setCategoryBreakdown(MOCK_DATA.category_breakdown);
    setRegionBreakdown(MOCK_DATA.region_breakdown);
    setInstanceBreakdown(MOCK_DATA.instance_breakdown);
    setDataTransfer(MOCK_DATA.data_transfer);
    setSavingsPlans(MOCK_DATA.savings_plans);
    setMonthlyTrend(MOCK_DATA.monthly_trend);
    setHourlyTrend(MOCK_DATA.hourly_trend);
    setTopServices(MOCK_DATA.top_services);
    setTopProjects(MOCK_DATA.top_projects);
    setEnvironmentBreakdown(MOCK_DATA.environment_breakdown);
    setTransactions(MOCK_DATA.transactions);
    setAccounts(MOCK_DATA.summary.accounts);
    setBudget(MOCK_DATA.budget);
    setLastUpdated(new Date());
    toast.success('Data refreshed successfully!');
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load data');
  }
  setLoading(false);
};

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (v) => `$${Number(v).toFixed(2)}`;
  const formatNumber = (v) => Number(v).toLocaleString();

  const serviceOptions = ['all', ...new Set(serviceBreakdown.map(s => s.service))];
  const regionOptions = ['all', ...new Set(regionBreakdown.map(r => r.region))];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
    toast.info('Filters applied');
  };

  const resetFilters = () => {
    setFilters({
      account: 'all',
      service: 'all',
      region: 'all',
      timeGrain: 'monthly',
      startDate: '',
      endDate: ''
    });
    fetchData();
    toast.info('Filters reset');
  };

  // ===== EXPORT FUNCTIONS =====
  const exportCSV = () => {
    const headers = ["Date", "Service", "Account", "Category", "Amount"];
    const rows = transactions.map(tx => [
      tx.date,
      tx.service,
      tx.account,
      tx.category,
      tx.amount
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "billing_data.csv";
    link.click();
    toast.success('CSV exported successfully!');
  };

  const exportPDF = () => {
    import("html2canvas").then(html2canvas => {
      import("jspdf").then(jspdf => {
        const { jsPDF } = jspdf;
        const input = document.getElementById("dashboard-content");
        html2canvas.default(input).then(canvas => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("dashboard.pdf");
          toast.success('PDF exported successfully!');
        });
      });
    });
  };

  if (loading) return <SkeletonLoader />;
  if (!summary) return <div className="error">Unable to load data.</div>;

  return (
    <div className="App" data-theme={isDark ? 'dark' : 'light'}>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop />
      
      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="logo">FinOps</span>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <i className="fas fa-home nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Home</span>}
          </button>
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <i className="fas fa-chart-pie nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Dashboard</span>}
          </button>
          <button
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('analytics')}
          >
            <i className="fas fa-chart-line nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Analytics</span>}
          </button>
          <button
            className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentPage('reports')}
          >
            <i className="fas fa-file-alt nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Reports</span>}
          </button>
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <i className="fas fa-cog nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Settings</span>}
          </button>
          <button
            className="nav-item"
            onClick={toggleTheme}
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} nav-icon`}></i>
            {sidebarOpen && <span className="nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <i className="fas fa-comment-dots nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Chat History</span>}
          </button>
          <button className="nav-item">
            <i className="fas fa-user-circle nav-icon"></i>
            {sidebarOpen && <span className="nav-label">Profile</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>

        {/* ===== HOME PAGE ===== */}
        {currentPage === 'home' && (
          <div className="page-content">
            <h2>Home</h2>
            <p className="page-subtitle">Welcome to the FinOps Analytics Platform. Select a module to get started.</p>
            <div className="home-grid">
              <div className="home-card" onClick={() => setCurrentPage('dashboard')}>
                <div className="home-icon"><i className="fas fa-chart-pie"></i></div>
                <h3>Dashboard</h3><p>Real-time cost visibility across all accounts</p>
              </div>
              <div className="home-card" onClick={() => setCurrentPage('analytics')}>
                <div className="home-icon"><i className="fas fa-chart-line"></i></div>
                <h3>Analytics</h3><p>Deep dive into your cost data and trends</p>
              </div>
              <div className="home-card" onClick={() => setCurrentPage('reports')}>
                <div className="home-icon"><i className="fas fa-file-alt"></i></div>
                <h3>Reports</h3><p>Generate and export detailed reports</p>
              </div>
              <div className="home-card" onClick={() => setCurrentPage('settings')}>
                <div className="home-icon"><i className="fas fa-cog"></i></div>
                <h3>Settings</h3><p>Configure your preferences and integrations</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== DASHBOARD PAGE ===== */}
        {currentPage === 'dashboard' && (
          <div id="dashboard-content" className="page-content">
            <div className="dashboard-header">
              <div>
                <h2>Dashboard</h2>
                <p className="page-subtitle">Unified cost intelligence across your AWS environment</p>
              </div>
              <div className="last-updated">
                <i className="fas fa-clock"></i> Last updated: {lastUpdated.toLocaleString()}
              </div>
            </div>

            {/* ===== EXPORT BUTTONS ===== */}
            <div className="export-buttons">
              <button className="btn-export" onClick={exportCSV}><i className="fas fa-file-csv"></i> Export CSV</button>
              <button className="btn-export" onClick={exportPDF}><i className="fas fa-file-pdf"></i> Export PDF</button>
            </div>

            {/* ===== FILTERS ===== */}
            <div className="filters">
              <div className="filter-group">
                <label><i className="fas fa-users"></i> Account</label>
                <select value={filters.account} onChange={(e) => handleFilterChange('account', e.target.value)} className="filter-select">
                  <option value="all">All Accounts</option>
                  {accounts.map((acc, idx) => (<option key={idx} value={acc.account}>{acc.account}</option>))}
                </select>
              </div>
              <div className="filter-group">
                <label><i className="fas fa-server"></i> Service</label>
                <select value={filters.service} onChange={(e) => handleFilterChange('service', e.target.value)} className="filter-select">
                  <option value="all">All Services</option>
                  {serviceOptions.filter(s => s !== 'all').map((s, idx) => (<option key={idx} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="filter-group">
                <label><i className="fas fa-globe"></i> Region</label>
                <select value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)} className="filter-select">
                  <option value="all">All Regions</option>
                  {regionOptions.filter(r => r !== 'all').map((r, idx) => (<option key={idx} value={r}>{r}</option>))}
                </select>
              </div>
              <div className="filter-group">
                <label><i className="fas fa-clock"></i> Time Grain</label>
                <select value={filters.timeGrain} onChange={(e) => handleFilterChange('timeGrain', e.target.value)} className="filter-select">
                  <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="filter-group">
                <label><i className="fas fa-calendar-alt"></i> From</label>
                <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
              </div>
              <div className="filter-group">
                <label><i className="fas fa-calendar-alt"></i> To</label>
                <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
              </div>
              <button className="btn-primary" onClick={applyFilters}><i className="fas fa-search"></i> Apply</button>
              <button className="btn-secondary" onClick={resetFilters}><i className="fas fa-undo"></i> Reset</button>
            </div>

            {/* ===== KPI CARDS ===== */}
            <div className="kpi-grid">
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-dollar-sign"></i> Total Cost</div><div className="kpi-value">{formatCurrency(summary.total_cost)}</div><div className="kpi-trend">Last 30 days</div></div>
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-calendar-day"></i> Daily Average</div><div className="kpi-value">{formatCurrency(summary.daily_avg || summary.total_cost / 30)}</div><div className="kpi-trend">Per day</div></div>
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-chart-simple"></i> Forecast</div><div className="kpi-value">{formatCurrency(summary.forecast || summary.total_cost * 1.08)}</div><div className="kpi-trend" style={{ color: '#eab308' }}>Month-end projection</div></div>
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-arrow-trend-up"></i> MoM Change</div><div className="kpi-value" style={{ color: summary.mom_change > 0 ? '#ef4444' : '#22c55e' }}>{summary.mom_change > 0 ? '↑' : '↓'} {Math.abs(summary.mom_change || 0).toFixed(1)}%</div><div className="kpi-trend">vs last month</div></div>
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-piggy-bank"></i> Savings Plan</div><div className="kpi-value">{savingsPlans?.coverage || 0}%</div><div className="kpi-trend" style={{ color: '#22c55e' }}>Coverage</div></div>
              <div className="kpi-card"><div className="kpi-label"><i className="fas fa-arrow-right-arrow-left"></i> Data Transfer</div><div className="kpi-value">12.3 TB</div><div className="kpi-trend">Last 30 days</div></div>
            </div>

            {/* ===== BUDGET VS ACTUAL CHART ===== */}
            {budget && (
              <div className="budget-card">
                <div className="budget-header">
                  <h3><i className="fas fa-wallet"></i> Budget vs Actual</h3>
                  <span className="chart-badge">{budget.percent_used.toFixed(1)}% used</span>
                </div>
                <div className="budget-bar">
                  <div className="budget-fill" style={{ width: `${Math.min(budget.percent_used, 100)}%` }}></div>
                </div>
                <div className="budget-details">
                  <span><strong>Budget:</strong> {formatCurrency(budget.total_budget)}</span>
                  <span><strong>Spent:</strong> {formatCurrency(budget.spent)}</span>
                  <span><strong>Remaining:</strong> {formatCurrency(budget.remaining)}</span>
                </div>
              </div>
            )}

            {/* ===== CHARTS ROW 1 ===== */}
            <div className="charts-grid">
              <div className="chart-card full-width">
                <div className="chart-header"><h3><i className="fas fa-chart-simple"></i> Cost Trend ({filters.timeGrain})</h3><span className="chart-badge">{filters.timeGrain === 'hourly' ? 'Last 24 hours' : filters.timeGrain === 'daily' ? 'Last 30 days' : '12 months'}</span></div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={filters.timeGrain === 'hourly' ? hourlyTrend : monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey={filters.timeGrain === 'hourly' ? 'hour' : 'month'} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey={filters.timeGrain === 'hourly' ? 'cost' : 'total_cost'} stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} />
                    <Line type="monotone" dataKey={filters.timeGrain === 'hourly' ? 'cost' : 'total_cost'} stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ===== CHARTS ROW 2 ===== */}
            <div className="charts-grid">
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-server"></i> Cost by Service</h3><span className="chart-badge">breakdown</span></div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={serviceBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="service" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-layer-group"></i> Cost by Category</h3><span className="chart-badge">breakdown</span></div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="total_cost" label={({ category, total_cost }) => `${category}: $${total_cost.toFixed(0)}`} labelLine={false}>
                      {categoryBreakdown.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ===== CHARTS ROW 3 ===== */}
            <div className="charts-grid">
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-globe"></i> Cost by Region</h3><span className="chart-badge">geographic</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={regionBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total_cost" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-microchip"></i> Cost by Instance Type</h3><span className="chart-badge">compute</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={instanceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="instance" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total_cost" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ===== DATA TRANSFER CHART ===== */}
            <div className="charts-grid">
              <div className="chart-card full-width"><div className="chart-header"><h3><i className="fas fa-arrow-right-arrow-left"></i> Data Transfer (In / Out / VPC)</h3><span className="chart-badge">network</span></div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dataTransfer}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(v) => `${v.toFixed(0)} GB`} />
                    <Legend />
                    <Line type="monotone" dataKey="in" stroke="#3b82f6" name="Data In" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="out" stroke="#ef4444" name="Data Out" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="vpc" stroke="#22c55e" name="VPC Transfer" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ===== BOTTOM GRID ===== */}
            <div className="bottom-grid">
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-project-diagram"></i> Top Projects</h3><span className="chart-badge">by cost</span></div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="project" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total_cost" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card"><div className="chart-header"><h3><i className="fas fa-cubes"></i> Environment Breakdown</h3><span className="chart-badge">distribution</span></div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={environmentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="total_cost" label={({ environment, total_cost }) => `${environment}: $${total_cost.toFixed(0)}`} labelLine={false}>
                      {environmentBreakdown.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ===== SAVINGS PLANS PANEL ===== */}
            <div className="savings-plans-panel">
              <div className="savings-plans-header"><h3><i className="fas fa-piggy-bank"></i> Savings Plans & Reserved Instances</h3><span className="chart-badge">optimization</span></div>
              <div className="savings-plans-grid">
                <div className="savings-card"><span>Coverage</span><strong>{savingsPlans?.coverage || 0}%</strong></div>
                <div className="savings-card"><span>Utilization</span><strong>{savingsPlans?.utilization || 0}%</strong></div>
                <div className="savings-card"><span>Monthly Savings</span><strong>{formatCurrency(savingsPlans?.monthly_savings || 0)}</strong></div>
                <div className="savings-card"><span>Total Savings</span><strong>{formatCurrency(savingsPlans?.total_savings || 0)}</strong></div>
                <div className="savings-card"><span>Commitment</span><strong>{formatCurrency(savingsPlans?.commitment || 0)}</strong></div>
                <div className="savings-card"><span>Actual Usage</span><strong>{formatCurrency(savingsPlans?.actual || 0)}</strong></div>
              </div>
            </div>

            {/* ===== TRANSACTION TABLE ===== */}
            <div className="chart-card full-width" style={{ marginTop: '16px' }}>
              <div className="chart-header"><h3><i className="fas fa-list-ul"></i> Recent Transactions</h3><span className="chart-badge">last 10</span></div>
              <div className="table-container">
                <table className="transaction-table">
                  <thead><tr><th>Date</th><th>Service</th><th>Account</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td>{tx.service}</td>
                        <td>{tx.account}</td>
                        <td><span className={`category-badge ${tx.category}`}>{tx.category}</span></td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== OTHER PAGES ===== */}
        {currentPage === 'analytics' && (
          <div className="page-content"><h2>Analytics</h2><p className="page-subtitle">Advanced cost analytics and forecasting modules will be available here.</p></div>
        )}
        {currentPage === 'reports' && (
          <div className="page-content"><h2>Reports</h2><p className="page-subtitle">Generate and export custom reports in PDF and CSV formats.</p></div>
        )}
        {currentPage === 'settings' && (
          <div className="page-content"><h2>Settings</h2><p className="page-subtitle">Configure your account, integrations, and notification preferences.</p></div>
        )}
      </main>
    </div>
  );
}

export default App;