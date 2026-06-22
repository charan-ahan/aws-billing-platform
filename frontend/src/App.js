import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './App.css';
import Chatbot from './Chatbot';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Professional color palette
const COLORS = {
  primary: '#1e293b',
  primaryLight: '#334155',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  gray: '#94a3b8',
  grayLight: '#e2e8f0',
  white: '#ffffff',
  background: '#f8fafc',
  cardBg: '#ffffff'
};

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

function App() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [s, m, sv, p, cm] = await Promise.all([
        axios.get(`${API_BASE_URL}/billing/analytics/summary${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/monthly-trend${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/top-services?limit=5${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/top-projects?limit=5${qs}`),
        axios.get(`${API_BASE_URL}/billing/analytics/current-month`)
      ]);

      setSummary(s.data);
      setMonthlyTrend(m.data);
      setTopServices(sv.data);
      setTopProjects(p.data);
      setCurrentMonth(cm.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Backend not running. Please start the server.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const formatCurrency = (v) => `$${Number(v).toFixed(2)}`;
  const formatNumber = (v) => Number(v).toLocaleString();
  
  const handleReset = () => { setStartDate(''); setEndDate(''); };
  const getChangeColor = (change) => {
    if (change === null || change === undefined) return COLORS.gray;
    return change > 0 ? COLORS.danger : COLORS.success;
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (!summary) return <div className="error">Unable to load data. Check backend connection.</div>;

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div>
            <h1>Billing Analytics</h1>
            <p>Transaction overview & insights</p>
          </div>
          <div className="header-meta">
            <span>{summary.total_records} transactions</span>
            <span>Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={fetchData}>Apply</button>
        <button className="btn-secondary" onClick={handleReset}>Reset</button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Transactions</div>
          <div className="kpi-value">{formatNumber(summary.total_records)}</div>
          <div className="kpi-trend">All time</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Cost</div>
          <div className="kpi-value">{formatCurrency(summary.total_cost)}</div>
          <div className="kpi-trend">Across all services</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Transaction</div>
          <div className="kpi-value">{formatCurrency(summary.average_cost)}</div>
          <div className="kpi-trend">Per record</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Current Month</div>
          <div className="kpi-value">{formatCurrency(currentMonth?.current_month_cost || 0)}</div>
          <div className="kpi-trend" style={{ color: getChangeColor(currentMonth?.change_percent) }}>
            {currentMonth?.change_percent !== undefined && currentMonth?.change_percent !== null ? (
              `${currentMonth.change_percent > 0 ? '↑' : '↓'} ${Math.abs(currentMonth.change_percent).toFixed(1)}% vs last month`
            ) : 'No previous data'}
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="charts-grid">
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Monthly Cost Trend</h3>
            <span className="chart-badge">12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total_cost" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Services</h3>
            <span className="chart-badge">by cost</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topServices} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="service" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip 
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Projects</h3>
            <span className="chart-badge">by cost</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="project" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip 
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="total_cost" fill="#60a5fa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Environment Breakdown</h3>
            <span className="chart-badge">distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={summary.environment_breakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="total_cost"
                label={({ environment, total_cost }) => `${environment}: $${total_cost.toFixed(0)}`}
                labelLine={false}
              >
                {(summary.environment_breakdown || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Quick Stats</h3>
            <span className="chart-badge">summary</span>
          </div>
          <div className="quick-stats">
            <div className="stat-row">
              <span>Total Services</span>
              <strong>{summary.service_breakdown?.length || 0}</strong>
            </div>
            <div className="stat-row">
              <span>Total Projects</span>
              <strong>{summary.project_breakdown?.length || 0}</strong>
            </div>
            <div className="stat-row">
              <span>Environments</span>
              <strong>{summary.environment_breakdown?.length || 0}</strong>
            </div>
            <div className="stat-row highlight">
              <span>Most Expensive Service</span>
              <strong>
                {topServices.length > 0 ? topServices[0].service : 'N/A'}
              </strong>
            </div>
            <div className="stat-row highlight">
              <span>Most Expensive Project</span>
              <strong>
                {topProjects.length > 0 ? topProjects[0].project : 'N/A'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Section */}
      <div className="chatbot-section">
        <Chatbot />
      </div>
    </div>
  );
}

export default App;