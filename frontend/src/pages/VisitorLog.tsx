import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Department, PurposeOfVisit, Staff, Visitor, VisitorStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  MagnifyingGlass,
  Buildings,
  Sparkle,
  Phone,
  Envelope,
  Clock,
  UserCheck,
  CaretLeft,
  CaretRight,
  Funnel,
  Eye,
  CalendarBlank,
} from '@phosphor-icons/react';

export const VisitorLog: React.FC = () => {
  const { isReceptionist } = useAuth();

  // Filters
  const [search, setSearch] = useState<string>('');
  const [preset, setPreset] = useState<'Today' | 'This Week' | 'This Month' | 'All'>(
    isReceptionist ? 'Today' : 'All'
  );
  const [department, setDepartment] = useState<Department | 'All'>('All');
  const [status, setStatus] = useState<VisitorStatus | 'All'>('All');
  const [purpose, setPurpose] = useState<PurposeOfVisit | 'All'>('All');
  const [staffId, setStaffId] = useState<string>('All');

  // Data & Pagination
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Detail Modal
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // Load Staff
  useEffect(() => {
    api.staff.getAll().then(setStaffList).catch(console.error);
  }, []);

  // Fetch visitors
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = {
      page,
      limit: 20,
    };
    if (search) params.search = search;
    if (preset !== 'All') params.preset = preset;
    if (department !== 'All') params.department = department;
    if (status !== 'All') params.status = status;
    if (purpose !== 'All') params.purpose_of_visit = purpose;
    if (staffId !== 'All') params.staff_to_see_id = staffId;

    api.visitors
      .getVisitors(params)
      .then((res) => {
        setVisitors(res.visitors);
        setTotal(res.total);
        setTotalPages(res.total_pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, preset, department, status, purpose, staffId, page]);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Searchable Visitor Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Comprehensive searchable repository of all registered visitors, purposes, and arrival records
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{visitors.length}</strong> of <strong>{total}</strong> records
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Free-text Search */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <MagnifyingGlass size={14} weight="bold" /> Search Records
            </label>
            <input
              className="form-control"
              placeholder="Name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Preset Buttons */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <CalendarBlank size={14} weight="bold" /> Date Preset
            </label>
            <select
              className="form-control"
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="All">All Historical Records</option>
              <option value="Today">Today Only</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <Buildings size={14} weight="duotone" /> Department
            </label>
            <select
              className="form-control"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="All">All Departments</option>
              <option value="Tech Institute">Technology Training Institute</option>
              <option value="Dry Cleaning">Dry Cleaning Service</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <UserCheck size={14} weight="bold" /> Staff Assigned
            </label>
            <select
              className="form-control"
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Staff Members</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department === 'Tech Institute' ? 'Tech' : 'Clean'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visitor Records Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Searching visitor records...
        </div>
      ) : visitors.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <FileText size={48} weight="duotone" color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Matching Records Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Try expanding your date preset or clearing active search keywords.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Phone Number</th>
                <th>Department</th>
                <th>Purpose of Visit</th>
                <th>Staff Assigned</th>
                <th>Arrival Datetime</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => {
                const isTech = v.department === 'Tech Institute';
                const arrival = new Date(v.arrival_datetime);

                let isOverstayed = false;
                if (v.status === 'In Progress') {
                  if (v.overstay_alerted) {
                    isOverstayed = true;
                  } else if (v.expected_duration) {
                    let threshold = 60;
                    if (v.expected_duration === '<15 min') threshold = 15;
                    else if (v.expected_duration === '15-30 min') threshold = 30;
                    else if (v.expected_duration === '30-60 min' || v.expected_duration === '1hr+') threshold = 60;
                    const elapsed = Math.floor((Date.now() - new Date(v.arrival_datetime).getTime()) / 60000);
                    isOverstayed = elapsed >= threshold;
                  }
                }

                return (
                  <tr key={v.id} onClick={() => setSelectedVisitor(v)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.full_name}</div>
                      {v.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.email}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{v.phone_number}</span>
                    </td>
                    <td>
                      <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`}>
                        {isTech ? <Buildings size={12} weight="duotone" /> : <Sparkle size={12} weight="duotone" />}
                        <span>{v.department}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{v.purpose_of_visit}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: v.staff_to_see ? 'var(--bitnox-cyan)' : 'var(--text-muted)' }}>
                        {v.staff_to_see?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{arrival.toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                        {isOverstayed && (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.18)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.45)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            Overstayed
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                      >
                        <Eye size={13} weight="bold" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Full Record Details Modal */}
      {selectedVisitor && (
        <div className="modal-overlay" onClick={() => setSelectedVisitor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} weight="duotone" color="var(--bitnox-cyan)" />
                <span>Visitor Complete Registry Dossier</span>
              </h3>
              <button className="btn-icon" onClick={() => setSelectedVisitor(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
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
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Department
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{selectedVisitor.department}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Purpose of Visit
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{selectedVisitor.purpose_of_visit}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Staff Assigned
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                    {selectedVisitor.staff_to_see?.name || 'General Reception'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Expected Duration
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                    {selectedVisitor.expected_duration || 'Standard'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Arrival Datetime
                  </div>
                  <div style={{ marginTop: '0.15rem' }}>
                    {new Date(selectedVisitor.arrival_datetime).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Checkout Datetime
                  </div>
                  <div style={{ marginTop: '0.15rem' }}>
                    {selectedVisitor.checkout_datetime
                      ? new Date(selectedVisitor.checkout_datetime).toLocaleString()
                      : 'Still in progress'}
                  </div>
                </div>
              </div>

              {selectedVisitor.services_requested && (
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Services Requested / Items
                  </div>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    {selectedVisitor.services_requested}
                  </div>
                </div>
              )}

              {selectedVisitor.remarks && (
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Reception & Staff Remarks
                  </div>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    {selectedVisitor.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedVisitor(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
