import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = () => {
  return (
    <div className="skeleton-container">
      {/* Header skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="skeleton-kpi-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-kpi-card">
            <div className="skeleton-line skeleton-label"></div>
            <div className="skeleton-line skeleton-value"></div>
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="skeleton-charts-grid">
        <div className="skeleton-chart-card full-width">
          <div className="skeleton-line skeleton-chart-title"></div>
          <div className="skeleton-chart-bar"></div>
        </div>
        <div className="skeleton-chart-card">
          <div className="skeleton-line skeleton-chart-title"></div>
          <div className="skeleton-chart-pie"></div>
        </div>
        <div className="skeleton-chart-card">
          <div className="skeleton-line skeleton-chart-title"></div>
          <div className="skeleton-chart-bars">
            <div className="skeleton-bar"></div>
            <div className="skeleton-bar"></div>
            <div className="skeleton-bar"></div>
            <div className="skeleton-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;