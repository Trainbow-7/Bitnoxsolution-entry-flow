import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { TrendChart } from '../components/charts/TrendChart';
import { DonutChart } from '../components/charts/DonutChart';
import { PeakHoursChart } from '../components/charts/PeakHoursChart';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Broadcast,
  CheckCircle,
  XCircle,
  TrendUp,
  ChartPieSlice,
  Clock,
  Briefcase,
  Buildings,
  Sparkle,
  ArrowsClockwise,
  ArrowRight,
  Warning,
} from '@phosphor-icons/react';

interface DashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab }) => {
  const { isStaff, isReceptionist } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [overstayCount, setOverstayCount] = useState<number>(0);

  const loadStats = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [data, alerts] = await Promise.all([
        api.dashboard.getStats(),
        api.visitors.getOverstayAlerts().catch(() => []),
      ]);
      setStats(data);
      setOverstayCount(alerts.length);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats(true);

    const handleRefresh = () => {
      loadStats(true);
    };

    window.addEventListener('bitnox_new_visitor', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    const interval = setInterval(() => loadStats(true), 15000); // 15s poll

    return () => {
      window.removeEventListener('bitnox_new_visitor', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <ArrowsClockwise size={32} className="spin" color="var(--tech-indigo)" weight="bold" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling executive analytics and telemetry...</p>
      </div>
    );
  }

  // Safe defaults to ensure robustness against partial server responses
  const safeStats: DashboardStats = {
    today_total: stats.today_total ?? (stats as any).total_visitors_today ?? 0,
    currently_in_office: stats.currently_in_office ?? 0,
    today_completed: stats.today_completed ?? 0,
    today_cancelled: stats.today_cancelled ?? 0,
    visits_per_day: Array.isArray(stats.visits_per_day) ? stats.visits_per_day : [],
    by_purpose: Array.isArray(stats.by_purpose) ? stats.by_purpose : [],
    by_department: Array.isArray(stats.by_department) && stats.by_department.length > 0 ? stats.by_department : [
      { department: 'Tech Institute', count: (stats as any).tech_institute_visitors_today || 0 },
      { department: 'Dry Cleaning', count: (stats as any).dry_cleaning_visitors_today || 0 },
    ],
    peak_hours: Array.isArray(stats.peak_hours) ? stats.peak_hours : [],
    staff_workload: Array.isArray(stats.staff_workload) ? stats.staff_workload : [],
  };

  // Purpose data format for donut
  const purposeDonutData = safeStats.by_purpose.map((item) => ({
    label: item.purpose,
    count: item.count,
  }));

  // Department data format for donut
  const deptDonutData = safeStats.by_department.map((item) => ({
    label: item.department,
    count: item.count,
    color: item.department === 'Tech Institute' ? '#00d2ff' : '#14b8a6',
  }));

  const totalHandledStaff = safeStats.staff_workload.reduce((sum, s) => sum + (s.count || 0), 0);

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Executive Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Real-time operations, throughput trends, and staff load for shared Bitnox premises
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onNavigateToTab && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('reports')}
              style={{ gap: '0.45rem' }}
              title="Navigate to Reports & Exports"
            >
              <span>View Reports</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadStats()}
            disabled={refreshing}
            style={{ gap: '0.4rem' }}
          >
            <ArrowsClockwise size={14} weight="bold" className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Overstay Alert Banner */}
      {overstayCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.16) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.22)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <Warning size={18} weight="fill" />
            </div>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                {overstayCount} {overstayCount === 1 ? 'Visitor has' : 'Visitors have'} exceeded their expected visit duration!
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Active in lobby/premises beyond scheduled threshold. Follow up or process checkout.
              </div>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('currently-in-office')}
              style={{
                gap: '0.4rem',
                borderColor: 'rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <span>View Overstayed Visitors</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          )}
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card tech">
          <div className="stat-info">
            <div className="stat-label">Total Visits Today</div>
            <div className="stat-value">{safeStats.today_total}</div>
            <div className="stat-sub">Across both departments</div>
          </div>
          <div className="stat-icon tech">
            <Users size={24} weight="duotone" />
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-info">
            <div className="stat-label">Currently In Office</div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>
              {safeStats.currently_in_office}
            </div>
            <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="pulse-dot amber" />
              <span>Active in queue/lobby</span>
            </div>
          </div>
          <div className="stat-icon warning">
            <Broadcast size={24} weight="duotone" />
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-info">
            <div className="stat-label">Completed Today</div>
            <div className="stat-value" style={{ color: '#34d399' }}>
              {safeStats.today_completed}
            </div>
            <div className="stat-sub">Checked out successfully</div>
          </div>
          <div className="stat-icon success">
            <CheckCircle size={24} weight="duotone" />
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-info">
            <div className="stat-label">Cancelled Today</div>
            <div className="stat-value" style={{ color: '#f87171' }}>
              {safeStats.today_cancelled}
            </div>
            <div className="stat-sub">Departed without service</div>
          </div>
          <div className="stat-icon danger">
            <XCircle size={24} weight="duotone" />
          </div>
        </div>
      </div>

      {/* 2. Charts Section - Grid 1: Trend and Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Trend Chart (30 Days) */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendUp size={18} color="var(--tech-indigo)" weight="bold" />
                <span>30-Day Daily Visitor Volume</span>
              </div>
              <div className="card-subtitle">
                Comparative timeline between Tech Institute and Dry Cleaning
              </div>
            </div>
          </div>
          <TrendChart data={safeStats.visits_per_day} />
        </div>

        {/* Department Split Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ChartPieSlice size={18} color="var(--clean-teal)" weight="bold" />
                <span>Department Split</span>
              </div>
              <div className="card-subtitle">Volume ratio by business unit</div>
            </div>
          </div>
          <DonutChart data={deptDonutData} centerLabel="Ratio" />
        </div>
      </div>

      {/* 3. Charts Section - Grid 2: Purpose Breakdown & Peak Visiting Hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
        {/* Purpose of Visit Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ChartPieSlice size={18} color="#f59e0b" weight="bold" />
                <span>Visits by Purpose</span>
              </div>
              <div className="card-subtitle">Categorization of visitor inquiries</div>
            </div>
          </div>
          <DonutChart data={purposeDonutData} centerLabel="Visits" />
        </div>

        {/* Peak Visiting Hours Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Clock size={18} color="var(--bitnox-cyan)" weight="bold" />
                <span>Peak Visiting Hours</span>
              </div>
              <div className="card-subtitle">Hourly traffic density (8:00 AM – 7:00 PM)</div>
            </div>
          </div>
          <PeakHoursChart data={safeStats.peak_hours} />
        </div>
      </div>

      {/* 4. Staff Workload Leaderboard Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Briefcase size={18} color="var(--tech-indigo)" weight="duotone" />
              <span>Staff Workload Distribution</span>
            </div>
            <div className="card-subtitle">
              Total appointments and visitors handled per staff member (past 30 days)
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Department</th>
                <th>Role Title</th>
                <th>Total Visitors</th>
                <th>Workload Share</th>
              </tr>
            </thead>
            <tbody>
              {safeStats.staff_workload.map((staff) => {
                const percent =
                  totalHandledStaff > 0
                    ? Math.round((staff.count / totalHandledStaff) * 100)
                    : 0;
                const isTech = staff.department === 'Tech Institute';

                return (
                  <tr key={staff.staff_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{staff.staff_name}</div>
                    </td>
                    <td>
                      <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`}>
                        {isTech ? <Buildings size={12} weight="duotone" /> : <Sparkle size={12} weight="duotone" />}
                        <span>{staff.department}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {staff.role_title || 'Specialist'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem' }}>{staff.count}</strong>
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            background: 'var(--bg-surface-elevated)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: isTech ? 'var(--tech-gradient)' : 'var(--clean-gradient)',
                              borderRadius: 'var(--radius-full)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '35px' }}>
                          {percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
