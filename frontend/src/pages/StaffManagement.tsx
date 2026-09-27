import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Department, Staff } from '../types';
import {
  IconBuilding,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSparkles,
  IconUsers,
  IconSearch,
} from '@tabler/icons-react';

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterDept, setFilterDept] = useState<Department | 'All'>('All');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  // Form inputs
  const [name, setName] = useState<string>('');
  const [department, setDepartment] = useState<Department>('Tech Institute');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.staff.getAll(filterDept !== 'All' ? filterDept : undefined);
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [filterDept]);

  const openAddModal = () => {
    setName('');
    setDepartment('Tech Institute');
    setRoleTitle('');
    setError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setName(s.name);
    setDepartment(s.department);
    setRoleTitle(s.role_title || '');
    setError(null);
    setEditingStaff(s);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff name is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.staff.create({
        name: name.trim(),
        department,
        role_title: roleTitle.trim() || undefined,
      });
      setIsAddOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!name.trim()) {
      setError('Staff name is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.staff.update(editingStaff.id, {
        name: name.trim(),
        department,
        role_title: roleTitle.trim() || undefined,
      });
      setEditingStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setActionLoading(true);
    try {
      await api.staff.delete(deletingStaff.id);
      setDeletingStaff(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.role_title && s.role_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Staff Directory Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Maintain personnel records and business department assignments
          </p>
        </div>

        <button className="btn btn-primary" onClick={openAddModal} style={{ gap: '0.4rem' }}>
          <IconPlus size={16} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <IconSearch size={16} />
          <input
            className="form-control"
            placeholder="Search staff by name or role title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['All', 'Tech Institute', 'Dry Cleaning'] as const).map((dept) => (
            <button
              key={dept}
              className={`chip ${filterDept === dept ? 'active' : ''}`}
              onClick={() => setFilterDept(dept)}
            >
              {dept === 'Tech Institute' && <IconBuilding size={13} />}
              {dept === 'Dry Cleaning' && <IconSparkles size={13} />}
              <span>{dept}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading staff directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <IconUsers size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No Staff Members Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Click "Add Staff Member" to add a new record.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Role Title</th>
                <th>Visitors Handled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((staff) => {
                const isTech = staff.department === 'Tech Institute';
                return (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {staff.name.toLowerCase().includes('oluwafemi') ? (
                          <img
                            src="/engr_oluwafemi.jpg"
                            alt={staff.name}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #f87171',
                              flexShrink: 0,
                            }}
                          />
                        ) : staff.name.toLowerCase().includes('ben') ? (
                          <img
                            src="/mr_ben_sam.jpg"
                            alt={staff.name}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid var(--bitnox-cyan)',
                              flexShrink: 0,
                            }}
                          />
                        ) : staff.name.toLowerCase().includes('kikelomo') ? (
                          <img
                            src="/receptionist.jpg"
                            alt={staff.name}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid var(--bitnox-cyan)',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <div style={{ fontWeight: 600 }}>{staff.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`}>
                        {isTech ? <IconBuilding size={11} /> : <IconSparkles size={11} />}
                        <span>{staff.department}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{staff.role_title || 'Specialist'}</span>
                    </td>
                    <td>
                      <strong>{staff._count?.visitors || 0}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(staff)}
                          title="Edit Staff Member"
                        >
                          <IconEdit size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingStaff(staff)}
                          title="Delete Staff Member"
                        >
                          <IconTrash size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Staff Member</h3>
              <button className="btn-icon" onClick={() => setIsAddOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="modal-body">
                {error && (
                  <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    className="form-control"
                    placeholder="e.g. Dr. Robert Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                  >
                    <option value="Tech Institute">Technology Training Institute</option>
                    <option value="Dry Cleaning">Dry Cleaning Service</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Role Title / Specialization</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Lead Python Instructor, Master Garment Presser"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Staff Record</h3>
              <button className="btn-icon" onClick={() => setEditingStaff(null)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {error && (
                  <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                  >
                    <option value="Tech Institute">Technology Training Institute</option>
                    <option value="Dry Cleaning">Dry Cleaning Service</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Role Title / Specialization</label>
                  <input
                    className="form-control"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingStaff(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#f87171' }}>Delete Staff Member</h3>
              <button className="btn-icon" onClick={() => setDeletingStaff(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove <strong>{deletingStaff.name}</strong> from the staff directory?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Existing visitor logs assigned to this staff member will be preserved with an unassigned label.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingStaff(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
