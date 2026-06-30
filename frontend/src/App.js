import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import './App.css';

const API_BASE_URL = 'https://aws-billing-platform.onrender.com';
const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

// ── Helpers ──────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v == null) return '$0';
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};
const fmtFull = (v) => `$${Number(v).toFixed(2)}`;

// ── Tooltip ──────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0D1525',
      border: '1px solid #1E293B',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: '#F1F5F9',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: '#94A3B8', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: p.color }}>
            {fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── App ──────────────────────────────────────────────────────────────────
function App() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [services, setServices] = useState([]);
  const [regions, setRegions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, m, sv, r, c] = await Promise.all([
          axios.get(`${API_BASE_URL}/billing/analytics/summary`),
          axios.get(`${API_BASE_URL}/billing/analytics/monthly-trend`),
          axios.get(`${API_BASE_URL}/billing/analytics/top-services?limit=6`),
          axios.get(`${API_BASE_URL}/billing/analytics/region-breakdown`),
          axios.get(`${API_BASE_URL}/billing/analytics/current-month`)
        ]);
        setSummary(s.data);
        setMonthly(m.data || []);
        setServices(sv.data || []);
        setRegions(r.data || []);
        setCurrent(c.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading" style={{ padding: 40, color: '#94A3B8' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 40, color: '#EF4444' }}>Error: {error}</div>;

  const totalCost = summary?.total_cost || 0;
  const dailyAvg = totalCost / 30;

  return (
    <div className="app-container" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', color: '#F1F5F9', background: '#060912', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>📊 Billing Analytics</h1>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0D1525', padding: 16, borderRadius: 12, border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>Total Cost</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(totalCost)}</div>
        </div>
        <div style={{ background: '#0D1525', padding: 16, borderRadius: 12, border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>Daily Avg</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(dailyAvg)}</div>
        </div>
        <div style={{ background: '#0D1525', padding: 16, borderRadius: 12, border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>Services</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{summary?.service_count || 0}</div>
        </div>
        <div style={{ background: '#0D1525', padding: 16, borderRadius: 12, border: '1px solid #1E293B' }}>
          <div style={{ color: '#94A3B8', fontSize: 12 }}>This Month</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace' }}>
            {current ? fmt(current.current_month_cost) : '$0'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            {current ? `${current.change_percent?.toFixed(1) || 0}% vs last` : ''}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div style={{ background: '#0D1525', padding: 20, borderRadius: 12, border: '1px solid #1E293B', marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => fmt(v)} />
            <Tooltip content={<DarkTooltip />} />
            <Area type="monotone" dataKey="total_cost" stroke="#2563EB" fill="rgba(37,99,235,0.2)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Services & Regions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#0D1525', padding: 20, borderRadius: 12, border: '1px solid #1E293B' }}>
          <h3 style={{ marginBottom: 12 }}>Top Services</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={services} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => fmt(v)} />
              <YAxis dataKey="service" type="category" tick={{ fontSize: 10, fill: '#94A3B8' }} width={100} />
              <Tooltip formatter={v => fmtFull(v)} />
              <Bar dataKey="total_cost" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#0D1525', padding: 20, borderRadius: 12, border: '1px solid #1E293B' }}>
          <h3 style={{ marginBottom: 12 }}>Regions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={v => fmtFull(v)} />
              <Bar dataKey="total_cost" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;