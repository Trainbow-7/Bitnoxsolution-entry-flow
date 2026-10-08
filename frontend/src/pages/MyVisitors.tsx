import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Visitor, VisitorStatus, Staff } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  MagnifyingGlass,
  Phone,
  Envelope,
  Buildings,
  Sparkle,
  FileText,
  SquaresFour,
  ArrowLeft,
  CheckCircle,
  ClockCounterClockwise,
  Funnel,
} from '@phosphor-icons/react';

interface MyVisitorsProps {
  onNavigateToDashboard?: () => void;
  mode?: 'active' | 'history' | 'all';
}

export const MyVisitors: React.FC<MyVisitorsProps> = ({ onNavigateToDashboard, mode = 'all' }) => {
  const { user, isStaff, isAdmin } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Status filter defaults based on mode
  const [statusFilter, setStatusFilter] = useState<VisitorStatus | 'All'>(() => {
    if (mode === 'active') return 'In Progress';
    if (mode === 'history') return 'Completed';
    return 'All';
  });

  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [checkingOut, setCheckingOut] = useState<boolean>(false);
  const [checkoutRemarks, setCheckoutRemarks] = useState<string>('');

  // Update status filter when mode prop changes
  useEffect(() => {
    if (mode === 'active') setStatusFilter('In Progress');
    else if (mode === 'history') setStatusFilter('Completed');
    else setStatusFilter('All');
  }, [mode]);

  // If Admin, load staff directory so Admin can view any staff member's visitors
  useEffect(() => {
    if (isAdmin) {
      api.staff
        .getAll()
        .then((list) => setStaffList(list))
        .catch((err) => console.error('Failed to load staff list for admin oversight:', err));
    }
  }, [isAdmin]);

  const fetchAssignedVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      };

      if (isAdmin && selectedStaffId !== 'All') {
        params.staff_to_see_id = selectedStaffId;
      } else if (isStaff) {
        if (user?.linked_staff_id) {
          params.staff_to_see_id = user.linked_staff_id;
        } else if (user?.name?.toLowerCase().includes('ben')) {
          params.staff_to_see_id = 'staff-ben';
        }
      }

      const res = await api.visitors.getMyVisitors(params);
      setVisitors(res.visitors || []);
    } catch (err: any) {
      console.error('Failed to load assigned visitors:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, isAdmin, isStaff, user, selectedStaffId]);

  useEffect(() => {
    fetchAssignedVisitors();
    const interval = setInterval(fetchAssignedVisitors, 3500);
    return () => clearInterval(interval);
  }, [fetchAssignedVisitors]);

  const handleCheckoutCurrent = async () => {
    if (!selectedVisitor) return;
    setCheckingOut(true);
    try {
      await api.visitors.checkOut(
        selectedVisitor.id,
        checkoutRemarks.trim() ? `Staff conclude: ${checkoutRemarks.trim()}` : 'Concluded and checked out by host staff'
      );
      setSelectedVisitor(null);
      setCheckoutRemarks('');
      await fetchAssignedVisitors();
    } catch (err: any) {
      alert(err.message || 'Failed to complete visitor checkout.');
    } finally {
      setCheckingOut(false);
    }
  };

  const isHistoryView = mode === 'history';

  return (
    <div className="page-wrapper">
      {/* Breadcrumb Navigation Bar for Admin */}
      {isAdmin && onNavigateToDashboard && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
          <button
            onClick={onNavigateToDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--bitnox-cyan)',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'transparent',
              padding: '0.2rem 0',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
            title="Return to Executive Dashboard"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>Executive Dashboard</span>
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Staff Visitors Oversight' : 'My Assigned Visitors'}
          </span>
        </div>
      )}

      {/* Main Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isHistoryView ? (
              <ClockCounterClockwise size={26} color="var(--bitnox-cyan)" weight="duotone" />
            ) : (
              <UserCheck size={26} color="var(--bitnox-cyan)" weight="duotone" />
            )}
            <h1 style={{ fontSize: '1.75rem' }}>
              {isAdmin
                ? 'Staff Visitors Oversight'
                : isHistoryView
                ? 'My Visit History'
                : 'My Assigned Visitors'}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isAdmin
              ? 'Administrator oversight of appointments and service requests assigned across all staff members'
              : isHistoryView
              ? `Historical record of completed and archived visits for ${user?.name}`
              : `Logged in as ${user?.name} • Real-time visitors and appointments assigned to you`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAdmin && onNavigateToDashboard && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToDashboard}
              style={{
                gap: '0.5rem',
                border: '1px solid var(--bitnox-cyan-border)',
                background: 'var(--bg-surface-elevated)',
                fontWeight: 600,
              }}
              title="Return to Executive Dashboard"
            >
              <SquaresFour size={15} color="var(--bitnox-cyan)" weight="duotone" />
              <span>Return to Dashboard</span>
            </button>
          )}

          {isStaff && user?.linked_staff && (
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
              }}
            >
              {user.linked_staff.department === 'Tech Institute' ? (
                <Buildings size={16} color="var(--bitnox-cyan)" weight="duotone" />
              ) : (
                <Sparkle size={16} color="#2dd4bf" weight="duotone" />
              )}
              <span>
                {user.linked_staff.department} • {user.linked_staff.role_title || 'Staff Specialist'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '360px' }}>
            <MagnifyingGlass size={16} weight="bold" />
            <input
              className="form-control"
              placeholder="Search by visitor name, phone, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Admin Staff Filter Selector */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Funnel size={15} color="var(--text-muted)" weight="bold" />
              <select
                className="form-control"
                style={{ minWidth: '200px' }}
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="All">All Staff Directory (Full Oversight)</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Chips */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {(['All', 'In Progress', 'Completed', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              className={`chip ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Visitors Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading visitor records...
        </div>
      ) : visitors.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <UserCheck size={48} weight="duotone" color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Visitors Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
            {isStaff
              ? 'No visitors matching the criteria have been assigned to your profile.'
              : 'No visitors found for the selected staff filter and status criteria.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Contact</th>
                {isAdmin && <th>Assigned Host</th>}
                <th>Purpose of Visit</th>
                <th>Expected Duration</th>
                <th>Arrival Datetime</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => {
                const arrival = new Date(v.arrival_datetime);
                return (
                  <tr key={v.id} onClick={() => setSelectedVisitor(v)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{v.full_name}</span>
                        {(v.purpose_of_visit === 'Existing Trainee' || v.services_requested?.toLowerCase().includes('ai') || v.services_requested?.toLowerCase().includes('ml')) && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(0, 210, 255, 0.15)',
                              color: 'var(--bitnox-cyan)',
                              border: '1px solid rgba(0, 210, 255, 0.3)',
                              borderRadius: '4px',
                              padding: '0.1rem 0.4rem',
                            }}
                          >
                            AI/ML Student
                          </span>
                        )}
                      </div>
                      {v.services_requested && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.services_requested}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{v.phone_number}</div>
                      {v.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.email}</div>}
                    </td>
                    {isAdmin && (
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--bitnox-cyan)' }}>
                          {v.staff_to_see?.name || 'Unassigned'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span style={{ fontWeight: 500 }}>{v.purpose_of_visit}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {v.expected_duration || 'Standard'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{arrival.toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
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
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="modal-overlay" onClick={() => setSelectedVisitor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} weight="duotone" color="var(--bitnox-cyan)" />
                <span>Visitor Appointment Dossier</span>
              </h3>
              <button className="btn-icon" onClick={() => setSelectedVisitor(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>{selectedVisitor.full_name}</h2>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={12} weight="bold" /> {selectedVisitor.phone_number}
                    </span>
                    {selectedVisitor.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Envelope size={12} weight="bold" /> {selectedVisitor.email}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`badge ${
                    selectedVisitor.status === 'In Progress'
                      ? 'badge-in-progress'
                      : selectedVisitor.status === 'Completed'
                      ? 'badge-completed'
                      : 'badge-cancelled'
                  }`}
                >
                  {selectedVisitor.status}
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Host / Staff:</span>{' '}
                  <strong style={{ color: 'var(--bitnox-cyan)' }}>
                    {selectedVisitor.staff_to_see?.name || 'Self'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span> {selectedVisitor.department}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Purpose of Visit:</span>{' '}
                  <strong>{selectedVisitor.purpose_of_visit}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Duration:</span>{' '}
                  {selectedVisitor.expected_duration || 'Not specified'}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Arrival Datetime:</span>{' '}
                  {new Date(selectedVisitor.arrival_datetime).toLocaleString()}
                </div>
                {selectedVisitor.checkout_datetime && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Checkout Datetime:</span>{' '}
                    {new Date(selectedVisitor.checkout_datetime).toLocaleString()}
                  </div>
                )}
                {selectedVisitor.services_requested && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Services Requested:</span>{' '}
                    {selectedVisitor.services_requested}
                  </div>
                )}
                {selectedVisitor.remarks && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Reception Remarks:</span>{' '}
                    {selectedVisitor.remarks}
                  </div>
                )}
              </div>

              {/* Host Quick Checkout Section if active */}
              {selectedVisitor.status === 'In Progress' && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} weight="bold" />
                    <span>Conclude & Check Out Appointment</span>
                  </div>
                  <input
                    className="form-control"
                    placeholder="Optional host checkout remarks..."
                    value={checkoutRemarks}
                    onChange={(e) => setCheckoutRemarks(e.target.value)}
                    style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleCheckoutCurrent}
                    disabled={checkingOut}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {checkingOut ? 'Checking Out...' : 'Mark Appointment Completed & Check Out'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedVisitor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
