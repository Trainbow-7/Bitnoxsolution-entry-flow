import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Department, PurposeOfVisit, ReportSummary, Visitor } from '../types';
import {
  FileXls,
  FilePdf,
  CalendarBlank,
  Funnel,
  Buildings,
  Sparkle,
  DownloadSimple,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from '@phosphor-icons/react';

export const Reports: React.FC = () => {
  const [preset, setPreset] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('This Month');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [department, setDepartment] = useState<Department | 'All'>('All');
  const [purpose, setPurpose] = useState<PurposeOfVisit | 'All'>('All');

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        preset: preset !== 'Custom' ? preset : undefined,
        date_from: preset === 'Custom' ? dateFrom : undefined,
        date_to: preset === 'Custom' ? dateTo : undefined,
        department: department !== 'All' ? department : undefined,
        purpose_of_visit: purpose !== 'All' ? purpose : undefined,
      };
      const data = await api.reports.getData(params);
      setSummary(data.summary);
      setVisitors(data.visitors);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [preset, dateFrom, dateTo, department, purpose]);

  // Pre-built template shortcuts
  const applyTemplate = (tmpl: 'daily' | 'weekly' | 'monthly' | 'tech' | 'clean') => {
    if (tmpl === 'daily') {
      setPreset('Today');
      setDepartment('All');
      setPurpose('All');
    } else if (tmpl === 'weekly') {
      setPreset('This Week');
      setDepartment('All');
      setPurpose('All');
    } else if (tmpl === 'monthly') {
      setPreset('This Month');
      setDepartment('All');
      setPurpose('All');
    } else if (tmpl === 'tech') {
      setPreset('This Month');
      setDepartment('Tech Institute');
      setPurpose('All');
    } else if (tmpl === 'clean') {
      setPreset('This Month');
      setDepartment('Dry Cleaning');
      setPurpose('All');
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await api.reports.downloadExcel({
        preset: preset !== 'Custom' ? preset : undefined,
        date_from: preset === 'Custom' ? dateFrom : undefined,
        date_to: preset === 'Custom' ? dateTo : undefined,
        department: department !== 'All' ? department : undefined,
        purpose_of_visit: purpose !== 'All' ? purpose : undefined,
      });
    } catch (err) {
      alert('Failed to generate Excel spreadsheet.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await api.reports.downloadPdf({
        preset: preset !== 'Custom' ? preset : undefined,
        date_from: preset === 'Custom' ? dateFrom : undefined,
        date_to: preset === 'Custom' ? dateTo : undefined,
        department: department !== 'All' ? department : undefined,
        purpose_of_visit: purpose !== 'All' ? purpose : undefined,
      });
    } catch (err) {
      alert('Failed to generate PDF document.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header & Export Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Reports & Export Generator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Generate executive compliance summaries, analytics tables, and formatted exports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadExcel}
            disabled={downloadingExcel || loading}
            style={{ gap: '0.5rem', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' }}
          >
            <FileXls size={16} weight="bold" />
            <span>{downloadingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            style={{ gap: '0.5rem' }}
          >
            <FilePdf size={16} weight="bold" />
            <span>{downloadingPdf ? 'Rendering PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Pre-built Templates */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Pre-Built Report Templates
        </div>
        <div className="chip-group">
          <button
            type="button"
            className={`chip ${preset === 'Today' && department === 'All' ? 'active' : ''}`}
            onClick={() => applyTemplate('daily')}
          >
            <Clock size={13} weight="bold" /> Daily Summary
          </button>
          <button
            type="button"
            className={`chip ${preset === 'This Week' && department === 'All' ? 'active' : ''}`}
            onClick={() => applyTemplate('weekly')}
          >
            <CalendarBlank size={13} weight="bold" /> Weekly Summary
          </button>
          <button
            type="button"
            className={`chip ${preset === 'This Month' && department === 'All' ? 'active' : ''}`}
            onClick={() => applyTemplate('monthly')}
          >
            <FileText size={13} weight="bold" /> Monthly Summary
          </button>
          <button
            type="button"
            className={`chip ${department === 'Tech Institute' ? 'active' : ''}`}
            onClick={() => applyTemplate('tech')}
          >
            <Buildings size={13} weight="duotone" /> Technology Institute Report
          </button>
          <button
            type="button"
            className={`chip ${department === 'Dry Cleaning' ? 'active' : ''}`}
            onClick={() => applyTemplate('clean')}
          >
            <Sparkle size={13} weight="duotone" /> Dry Cleaning Service Report
          </button>
        </div>
      </div>

      {/* Filters Form */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <CalendarBlank size={14} weight="bold" /> Date Preset
            </label>
            <select
              className="form-control"
              value={preset}
              onChange={(e) => setPreset(e.target.value as any)}
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Date Range</option>
            </select>
          </div>

          {preset === 'Custom' && (
            <>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <Buildings size={14} weight="duotone" /> Department
            </label>
            <select
              className="form-control"
              value={department}
              onChange={(e) => setDepartment(e.target.value as any)}
            >
              <option value="All">All Departments</option>
              <option value="Tech Institute">Technology Training Institute</option>
              <option value="Dry Cleaning">Dry Cleaning Service</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <Funnel size={14} weight="bold" /> Purpose of Visit
            </label>
            <select
              className="form-control"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
            >
              <option value="All">All Purposes</option>
              <option value="Prospective Student">Prospective Student</option>
              <option value="Existing Trainee">Existing Trainee</option>
              <option value="Dry Cleaning Customer">Dry Cleaning Customer</option>
              <option value="Business Partner">Business Partner</option>
              <option value="Job Applicant">Job Applicant</option>
              <option value="Vendor">Vendor</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="stat-grid">
          <div className="stat-card tech">
            <div className="stat-info">
              <div className="stat-label">Total Filtered Visits</div>
              <div className="stat-value">{summary.total}</div>
              <div className="stat-sub">In selected period</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-info">
              <div className="stat-label">Completed Visits</div>
              <div className="stat-value" style={{ color: '#34d399' }}>{summary.completed}</div>
              <div className="stat-sub">{summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}% success rate</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-info">
              <div className="stat-label">In Progress / Active</div>
              <div className="stat-value" style={{ color: '#fbbf24' }}>{summary.inProgress}</div>
              <div className="stat-sub">Currently on premises</div>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-info">
              <div className="stat-label">Cancelled Visits</div>
              <div className="stat-value" style={{ color: '#f87171' }}>{summary.cancelled}</div>
              <div className="stat-sub">{summary.total > 0 ? Math.round((summary.cancelled / summary.total) * 100) : 0}% departure rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Data Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FileText size={18} weight="duotone" color="var(--bitnox-cyan)" />
              <span>Report Data Preview ({visitors.length} Records)</span>
            </div>
            <div className="card-subtitle">
              Interactive preview matching the export schema for Excel and PDF files
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Compiling report records...
          </div>
        ) : visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No visitor records match the applied criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Purpose</th>
                  <th>Staff Assigned</th>
                  <th>Arrival Datetime</th>
                  <th>Checkout Datetime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visitors.slice(0, 50).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.full_name}</div>
                    </td>
                    <td>{v.phone_number}</td>
                    <td>
                      <span className={`badge ${v.department === 'Tech Institute' ? 'badge-tech' : 'badge-dryclean'}`}>
                        {v.department}
                      </span>
                    </td>
                    <td>{v.purpose_of_visit}</td>
                    <td>{v.staff_to_see?.name || 'General Reception'}</td>
                    <td>{new Date(v.arrival_datetime).toLocaleString()}</td>
                    <td>{v.checkout_datetime ? new Date(v.checkout_datetime).toLocaleString() : 'In Progress'}</td>
                    <td>
                      <span
                        className={`badge ${
                          v.status === 'In Progress'
                            ? 'badge-in-progress'
                            : v.status === 'Completed'
                            ? 'badge-completed'
                            : 'badge-cancelled'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visitors.length > 50 && (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing top 50 of {visitors.length} records in preview. Full dataset will be exported to Excel / PDF.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
