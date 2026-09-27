import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLog as AuditLogType } from '../types';
import {
  ShieldWarning,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Clock,
  User,
  Eye,
  Pulse,
} from '@phosphor-icons/react';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const [inspectLog, setInspectLog] = useState<AuditLogType | null>(null);

  useEffect(() => {
    setLoading(true);
    api.audit
      .getLogs({
        action: actionFilter !== 'All' ? actionFilter : undefined,
        search: search || undefined,
        page,
        limit: 25,
      })
      .then((res) => {
        setLogs(res.logs);
        setTotal(res.total);
        setTotalPages(res.total_pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actionFilter, search, page]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'check_in':
        return { bg: 'var(--bitnox-cyan-subtle)', text: 'var(--bitnox-cyan)', border: 'var(--bitnox-cyan-border)' };
      case 'check_out':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'cancel_visit':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'edit_visitor':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Security & System Audit Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Immutable security trail of check-ins, check-outs, modifications, and administrative activities
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Total logged entries: <strong>{total}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <MagnifyingGlass size={16} weight="bold" />
          <input
            className="form-control"
            placeholder="Search audit trail by actor, action, or visitor details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['All', 'check_in', 'check_out', 'cancel_visit', 'edit_visitor', 'update_settings'] as const).map(
            (act) => (
              <button
                key={act}
                className={`chip ${actionFilter === act ? 'active' : ''}`}
                onClick={() => {
                  setActionFilter(act);
                  setPage(1);
                }}
              >
                {act === 'All' ? 'All Actions' : act.replace('_', ' ').toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading audit trail records...
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldWarning size={48} weight="duotone" color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No Audit Log Entries Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No events match your current filter settings.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor User</th>
                <th>Action</th>
                <th>Target Visitor</th>
                <th>Details Payload</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const badgeStyle = getActionBadgeColor(log.action);
                const time = new Date(log.created_at);

                return (
                  <tr key={log.id} onClick={() => setInspectLog(log)}>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{time.toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {time.toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</div>
                      <span className={`user-role-badge role-${log.user?.role?.toLowerCase() || 'admin'}`} style={{ fontSize: '0.65rem' }}>
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          border: `1px solid ${badgeStyle.border}`,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {log.target_visitor ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{log.target_visitor.full_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {log.target_visitor.department}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {log.details ? JSON.stringify(log.details) : 'None'}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectLog(log);
                        }}
                      >
                        <Eye size={13} weight="bold" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <CaretLeft size={16} weight="bold" />
            <span>Previous</span>
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <span>Next</span>
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Inspector Modal */}
      {inspectLog && (
        <div className="modal-overlay" onClick={() => setInspectLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pulse size={18} color="var(--bitnox-cyan)" weight="bold" />
                <span>Audit Trail Event Inspector</span>
              </h3>
              <button className="btn-icon" onClick={() => setInspectLog(null)}>&times;</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Action:</span>{' '}
                  <strong>{inspectLog.action}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Event ID:</span>{' '}
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{inspectLog.id.slice(0, 13)}...</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Actor:</span>{' '}
                  <strong>{inspectLog.user?.name}</strong> ({inspectLog.user?.role})
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>{' '}
                  {new Date(inspectLog.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Full JSON Event Payload
              </div>
              <pre
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--bitnox-cyan)',
                  overflowX: 'auto',
                  lineHeight: 1.4,
                }}
              >
                {JSON.stringify(inspectLog.details, null, 2)}
              </pre>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInspectLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
