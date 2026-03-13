import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './StudySummary.css';

const StudySummary = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { label: '單字總數', value: stats?.totalReviews || 0, unit: '個' },
    { label: '學習次數', value: stats?.sessions || 0, unit: '次' },
    { label: '記憶成功率', value: stats?.retentionRate || 0, unit: '%' },
    { label: '平均回想時間', value: stats?.avgRecall || 0, unit: '秒' }
  ];

  if (loading) {
    return (
      <section className="study-summary-section">
        <div className="section-header">
          <h2 className="section-title">學習統計 Study Summary</h2>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-pill-card skeleton-card">
              <div className="skeleton-line label-skeleton"></div>
              <div className="skeleton-line value-skeleton"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="study-summary-section">
      <div className="section-header">
        <h2 className="section-title">學習統計 Study Summary</h2>
      </div>
      <div className="stats-grid">
        {statItems.map((stat) => (
          <div key={stat.label} className="stat-pill-card">
            <span className="stat-pill-label">{stat.label}</span>
            <div className="stat-pill-content">
              <span className="stat-pill-value">{stat.value}</span>
              <span className="stat-pill-unit">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudySummary;
