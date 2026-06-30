import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://aws-billing-platform.onrender.com';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/billing/analytics/summary`);
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: '40px', color: 'white' }}>No data</div>;

  return (
    <div style={{ padding: '40px', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
      <h1>✅ Data fetched successfully</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;