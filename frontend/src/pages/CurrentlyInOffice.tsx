import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Visitor, Department } from '../types';
import {
  Broadcast,
  ArrowsClockwise,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Buildings,
  Sparkle,
  Phone,
  WarningCircle,
  MagnifyingGlass,
} from '@phosphor-icons/react';

interface CurrentlyInOfficeProps {
  onCountChange?: (count: number) => void;
}

export const CurrentlyInOffice: React.FC<CurrentlyInOfficeProps> = ({ onCountChange }) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Checkout confirmation modal state
  const [checkingOutVisitor, setCheckingOutVisitor] = useState<Visitor | null>(null);
  const [checkoutRemarks, setCheckoutRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Cancellation modal state
  const [cancellingVisitor, setCancellingVisitor] = useState<Visitor | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Notification message
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLiveVisitors = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await api.visitors.getCurrentlyInOffice();
      setVisitors(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: any) {
      console.error('Failed to load live visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchLiveVisitors();
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLiveVisitors(true);
      }, 15000); // 15 seconds polling
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLiveVisitors]);

  // Calculate elapsed time formatted
  const getElapsedString = (arrivalDatetime: string) => {
    const diffMs = new Date().getTime() - new Date(arrivalDatetime).getTime();
    const totalMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isVisitorOverstayed = (visitor: Visitor): boolean => {
    if (visitor.status !== 'In Progress') return false;
    if (visitor.overstay_alerted) return true;
    if (!visitor.expected_duration) return false;
    let threshold = 60;
    if (visitor.expected_duration === '<15 min') threshold = 15;
    else if (visitor.expected_duration === '15-30 min') threshold = 30;
    else if (visitor.expected_duration === '30-60 min' || visitor.expected_duration === '1hr+') threshold = 60;
    else return false;

    const elapsed = Math.floor((Date.now() - new Date(visitor.arrival_datetime).getTime()) / 60000);
    return elapsed >= threshold;
  };

  const handleConfirmCheckout = async () => {
    if (!checkingOutVisitor) return;
    setActionLoading(true);
    try {
      const res = await api.visitors.checkOut(checkingOutVisitor.id, checkoutRemarks);
      setAlertBanner({
        type: 'success',
        text: `Checked out ${checkingOutVisitor.full_name}. Total time on premises: ${res.duration_minutes} minutes.`,
      });
      setCheckingOutVisitor(null);
      setCheckoutRemarks('');
      await fetchLiveVisitors();
    } catch (err: any) {
      setAlertBanner({ type: 'error', text: err.message || 'Failed to check out visitor.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingVisitor) return;
    setActionLoading(true);
    try {
      await api.visitors.cancel(cancellingVisitor.id, cancellationReason);
      setAlertBanner({
        type: 'success',
        text: `Visit cancelled for ${cancellingVisitor.full_name}.`,
      });
      setCancellingVisitor(null);
      setCancellationReason('');
      await fetchLiveVisitors();
    } catch (err: any) {
      setAlertBanner({ type: 'error', text: err.message || 'Failed to cancel visitor.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = visitors.filter((v) => {
    const matchesDept = selectedDept === 'All' || v.department === selectedDept;
    const matchesSearch =
      !searchQuery ||
      v.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone_number.includes(searchQuery) ||
      (v.staff_to_see?.name && v.staff_to_see.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="pulse-dot amber" />
            <h1 style={{ fontSize: '1.75rem' }}>Currently In Office</h1>
            <span className="badge badge-in-progress" style={{ fontSize: '0.85rem' }}>
              {visitors.length} Active {visitors.length === 1 ? 'Visitor' : 'Visitors'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Live status of on-premise visitors awaiting or receiving service
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: 'var(--tech-indigo)' }}
            />
            Auto-refresh (15s)
          </label>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchLiveVisitors()}
            disabled={refreshing}
            style={{ gap: '0.4rem' }}
          >
            <ArrowsClockwise size={14} weight="bold" className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertBanner && (
        <div
          style={{
            background: alertBanner.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${alertBanner.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: alertBanner.type === 'success' ? '#34d399' : '#f87171',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{alertBanner.text}</span>
          <button
            onClick={() => setAlertBanner(null)}
            style={{ color: 'inherit', fontWeight: 700, fontSize: '1rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <MagnifyingGlass size={16} weight="bold" />
          <input
            className="form-control"
            placeholder="Search active visitors by name, phone, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['All', 'Tech Institute', 'Dry Cleaning'] as const).map((dept) => (
            <button
              key={dept}
              className={`chip ${selectedDept === dept ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept === 'Tech Institute' && <Buildings size={13} weight="duotone" />}
              {dept === 'Dry Cleaning' && <Sparkle size={13} weight="duotone" />}
              <span>{dept}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Visitors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading live office registry...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Broadcast size={48} weight="duotone" color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Visitors Currently In Office</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
            {searchQuery
              ? 'No active visitors match your search filter.'
              : 'The reception queue is clear. New visitors will appear here automatically upon check-in.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filtered.map((visitor) => {
            const isTech = visitor.department === 'Tech Institute';
            const arrivalTime = new Date(visitor.arrival_datetime);
            const isOverstayed = isVisitorOverstayed(visitor);

            return (
              <div
                key={visitor.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isOverstayed
                    ? '4px solid #ef4444'
                    : `4px solid ${isTech ? 'var(--tech-indigo)' : 'var(--clean-teal)'}`,
                  boxShadow: isOverstayed ? '0 0 15px rgba(239, 68, 68, 0.15)' : undefined,
                }}
              >
                <div>
                  {/* Top card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{visitor.full_name}</h3>
                        {isOverstayed && (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.18)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.45)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                            <span>Overstayed</span>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        <Phone size={12} weight="bold" />
                        <span>{visitor.phone_number}</span>
                      </div>
                    </div>

                    <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`} style={{ whiteSpace: 'nowrap' }}>
                      {isTech ? <Buildings size={12} weight="duotone" /> : <Sparkle size={12} weight="duotone" />}
                      <span>{visitor.department}</span>
                    </span>
                  </div>

                  {/* Visit Details */}
                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Purpose:</span>{' '}
                      <strong>{visitor.purpose_of_visit}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Staff Assigned:</span>{' '}
                      <span style={{ color: visitor.staff_to_see ? 'var(--bitnox-cyan)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {visitor.staff_to_see ? visitor.staff_to_see.name : 'General Lobby'}
                      </span>
                      {visitor.staff_to_see?.role_title && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.3rem' }}>
                          ({visitor.staff_to_see.role_title})
                        </span>
                      )}
                    </div>

                    {visitor.services_requested && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Services:</span> {visitor.services_requested}
                      </div>
                    )}

                    {visitor.expected_duration && (
                      <div style={{ fontSize: '0.8rem', color: isOverstayed ? '#f87171' : 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Expected Duration:</span>{' '}
                        <strong>{visitor.expected_duration}</strong>
                      </div>
                    )}
                  </div>

                  {/* Time stats */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      padding: '0.4rem 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} color="var(--text-muted)" weight="bold" />
                      <span>Arrived: {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: isOverstayed ? '#f87171' : '#fbbf24',
                        fontWeight: 700,
                      }}
                    >
                      <span className={`pulse-dot ${isOverstayed ? 'red' : 'amber'}`} style={isOverstayed ? { background: '#ef4444' } : undefined} />
                      <span>{getElapsedString(visitor.arrival_datetime)} on premises</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '0.6rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => setCheckingOutVisitor(visitor)}
                    style={{ width: '100%', gap: '0.4rem' }}
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Check Out</span>
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setCancellingVisitor(visitor)}
                    title="Cancel Visit"
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    <XCircle size={15} weight="bold" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {checkingOutVisitor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#10b981" weight="duotone" />
                <span>Confirm Visitor Check-Out</span>
              </h3>
              <button
                className="btn-icon"
                onClick={() => setCheckingOutVisitor(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                You are checking out <strong>{checkingOutVisitor.full_name}</strong>.
              </p>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span> {checkingOutVisitor.department}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Arrival Time:</span>{' '}
                  {new Date(checkingOutVisitor.arrival_datetime).toLocaleTimeString()}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Calculated Duration:</span>{' '}
                  <strong style={{ color: '#34d399' }}>{getElapsedString(checkingOutVisitor.arrival_datetime)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkout-remarks">
                  Departure Remarks / Resolution (Optional)
                </label>
                <textarea
                  id="checkout-remarks"
                  className="form-control"
                  placeholder="e.g. Completed intake interview, garment tag released, payment collected..."
                  value={checkoutRemarks}
                  onChange={(e) => setCheckoutRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setCheckingOutVisitor(null)}
                disabled={actionLoading}
              >
                Go Back
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmCheckout}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Complete Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Visit Modal */}
      {cancellingVisitor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <WarningCircle size={20} weight="duotone" />
                <span>Cancel Visitor Entry</span>
              </h3>
              <button
                className="btn-icon"
                onClick={() => setCancellingVisitor(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                Mark visit as cancelled for <strong>{cancellingVisitor.full_name}</strong>?
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="cancellation-reason">
                  Reason for Cancellation
                </label>
                <input
                  id="cancellation-reason"
                  className="form-control"
                  placeholder="e.g. Left lobby without being attended, rescheduled, incorrect office..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setCancellingVisitor(null)}
                disabled={actionLoading}
              >
                Back
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
