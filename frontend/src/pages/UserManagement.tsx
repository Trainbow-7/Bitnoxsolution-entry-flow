import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Staff, User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  PencilSimple,
  Trash,
  Briefcase,
  Lock,
  Envelope,
  User as UserIcon,
} from '@phosphor-icons/react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Receptionist');
  const [linkedStaffId, setLinkedStaffId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAndStaff = async () => {
    setLoading(true);
    try {
      const [uData, sData] = await Promise.all([api.users.getAll(), api.staff.getAll()]);
      setUsers(uData);
      setStaffList(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndStaff();
  }, []);

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('Receptionist');
    setLinkedStaffId('');
    setError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (u: User) => {
    setName(u.name);
    setEmail(u.email);
    setPassword(''); // leave blank unless changing
    setRole(u.role);
    setLinkedStaffId(u.linked_staff_id || '');
    setError(null);
    setEditingUser(u);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and initial password are required.');
      return;
    }
    if (role === 'Staff' && !linkedStaffId) {
      setError('Please select a linked Staff record for the Staff role.');
      return;
    }

    setActionLoading(true);
    try {
      await api.users.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        linked_staff_id: role === 'Staff' ? linkedStaffId : null,
      });
      setIsAddOpen(false);
      await fetchUsersAndStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (role === 'Staff' && !linkedStaffId) {
      setError('Please select a linked Staff record for the Staff role.');
      return;
    }

    setActionLoading(true);
    try {
      await api.users.update(editingUser.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password ? password : undefined,
        role,
        linked_staff_id: role === 'Staff' ? linkedStaffId : null,
      });
      setEditingUser(null);
      await fetchUsersAndStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await api.users.delete(deletingUser.id);
      setDeletingUser(null);
      await fetchUsersAndStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>User Accounts & Role Permissions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage administrative, receptionist, and staff access accounts with RBAC credentials
          </p>
        </div>

        <button className="btn btn-primary" onClick={openAddModal} style={{ gap: '0.4rem' }}>
          <Plus size={16} weight="bold" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading user accounts...
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Linked Staff Record</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{u.name}</span>
                        {isSelf && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--bitnox-cyan)', background: 'var(--bitnox-cyan-subtle)', border: '1px solid var(--bitnox-cyan-border)', padding: '1px 6px', borderRadius: '4px' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`user-role-badge role-${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'Staff' ? (
                        u.linked_staff ? (
                          <span style={{ color: '#5eead4', fontSize: '0.85rem' }}>
                            {u.linked_staff.name} ({u.linked_staff.department})
                          </span>
                        ) : (
                          <span style={{ color: '#f87171', fontSize: '0.8rem' }}>Unlinked Staff Profile</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A (Non-Staff Role)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(u)}
                          title="Edit User Account"
                        >
                          <PencilSimple size={13} weight="bold" />
                          <span>Edit</span>
                        </button>

                        {!isSelf && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingUser(u)}
                            title="Delete User Account"
                          >
                            <Trash size={13} weight="bold" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add System User</h3>
              <button className="btn-icon" onClick={() => setIsAddOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="modal-body">
                {error && (
                  <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    <UserIcon size={14} weight="bold" /> Full Name <span className="required">*</span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Envelope size={14} weight="bold" /> Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. sconnor@bitnox.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={14} weight="bold" /> Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Assignment <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="Receptionist">Receptionist (Check-in, Live View, Search)</option>
                    <option value="Staff">Staff (Scoped to own assigned visitors only)</option>
                    <option value="Admin">Admin (Full system and executive access)</option>
                  </select>
                </div>

                {role === 'Staff' && (
                  <div className="form-group">
                    <label className="form-label">
                      <Briefcase size={14} weight="duotone" /> Link to Staff Member Record <span className="required">*</span>
                    </label>
                    <select
                      className="form-control"
                      value={linkedStaffId}
                      onChange={(e) => setLinkedStaffId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Personnel Profile --</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit User Account</h3>
              <button className="btn-icon" onClick={() => setEditingUser(null)}>&times;</button>
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
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reset Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Assignment</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="Receptionist">Receptionist</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {role === 'Staff' && (
                  <div className="form-group">
                    <label className="form-label">Link to Staff Record</label>
                    <select
                      className="form-control"
                      value={linkedStaffId}
                      onChange={(e) => setLinkedStaffId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Personnel Profile --</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#f87171' }}>Delete User Account</h3>
              <button className="btn-icon" onClick={() => setDeletingUser(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the login account for <strong>{deletingUser.name}</strong> ({deletingUser.email})?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
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
