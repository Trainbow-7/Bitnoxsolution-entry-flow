import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Buildings,
  Sparkle,
  SignOut,
  Clock,
  List,
  CaretDown,
  UserCheck,
  Shield,
  Briefcase,
} from '@phosphor-icons/react';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, currentTab }) => {
  const { user, role, isAdmin, isReceptionist, logout, quickLogin } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showSwitchMenu, setShowSwitchMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSwitch = async (
    target: 'Admin' | 'Receptionist' | 'Staff-Alex' | 'Staff-Ben' | 'Staff-Usman' | 'Staff-Elena'
  ) => {
    setShowSwitchMenu(false);
    await quickLogin(target);
  };

  // Only appear on the admin/ceo dashboard, completely removed from every other staff dashboard
  const showRoleSwitcher = Boolean(isAdmin && (!currentTab || currentTab === 'dashboard'));

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          style={{ display: 'none' }}
          id="mobile-nav-toggle"
        >
          <List size={20} weight="bold" />
        </button>

        <div className="dual-unit-indicator">
          <div className="unit-chip tech">
            <Buildings size={14} weight="duotone" />
            <span>Tech Institute</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <div className="unit-chip clean">
            <Sparkle size={14} weight="duotone" />
            <span>Dry Cleaning</span>
          </div>
        </div>

        {/* Receptionist Headshot & Front Desk Badge - Shown only for Receptionist on check-in screens, hidden on Executive Dashboard */}
        {isReceptionist && currentTab !== 'dashboard' && (
          <div
            className="receptionist-badge"
            title="Receptionist: Kikelomo Oluwanishola (Front Desk & Check-In)"
          >
            <div className="receptionist-badge-avatar">
              <img
                src="/receptionist.jpg"
                alt="Receptionist Kikelomo Oluwanishola"
                className="receptionist-img"
              />
              <span className="receptionist-online-dot" />
            </div>
            <div className="receptionist-badge-meta">
              <span className="receptionist-badge-role">Front Desk</span>
              <span className="receptionist-badge-name">Kikelomo O.</span>
            </div>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Live Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface-elevated)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Clock size={14} color="var(--bitnox-cyan)" weight="bold" />
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
        </div>

        {/* Demo Quick Role Switcher Button - Shown ONLY on Admin Dashboard */}
        {showRoleSwitcher && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              style={{ border: '1px dashed var(--bitnox-cyan)', gap: '0.4rem' }}
              title="Fast switch between demo accounts without re-entering credentials"
            >
              <UserCheck size={14} color="var(--bitnox-cyan)" weight="bold" />
              <span style={{ fontSize: '0.8rem' }}>Role Switcher</span>
              <CaretDown size={14} weight="bold" />
            </button>

            {showSwitchMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '280px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '0.6rem',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '0.3rem 0.5rem',
                  }}
                >
                  Instant Demo Logins
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
                  onClick={() => handleRoleSwitch('Receptionist')}
                >
                  <img
                    src="/receptionist.jpg"
                    alt="Receptionist Kikelomo"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--bitnox-cyan)',
                      flexShrink: 0,
                    }}
                  />
                  <span>Receptionist (Kikelomo)</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
                  onClick={() => handleRoleSwitch('Staff-Ben')}
                >
                  <img
                    src="/mr_ben_sam.jpg"
                    alt="Mr. Ben Sam"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--bitnox-cyan)',
                      flexShrink: 0,
                    }}
                  />
                  <span>Staff: Mr. Ben Sam (AI/ML)</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
                  onClick={() => handleRoleSwitch('Staff-Usman')}
                >
                  <Briefcase size={16} color="var(--bitnox-cyan)" weight="duotone" />
                  <span>Staff: Mr. Usman Oyeboade (Data)</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
                  onClick={() => handleRoleSwitch('Staff-Elena')}
                >
                  <Briefcase size={16} color="#2dd4bf" weight="duotone" />
                  <span>Staff: Elena (Dry Cleaning)</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
                  onClick={() => handleRoleSwitch('Admin')}
                >
                  <img
                    src="/engr_oluwafemi.jpg"
                    alt="Engr Oluwafemi Faleye"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid #f87171',
                      flexShrink: 0,
                    }}
                  />
                  <span>Admin / CEO (Engr Oluwafemi)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isReceptionist ? (
            <img
              src="/receptionist.jpg"
              alt={user?.name || 'Receptionist'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--bitnox-cyan)',
                boxShadow: '0 0 10px rgba(0, 210, 255, 0.35)',
              }}
            />
          ) : (isAdmin || user?.name?.toLowerCase().includes('oluwafemi')) ? (
            <img
              src="/engr_oluwafemi.jpg"
              alt={user?.name || 'Engr Oluwafemi Faleye'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #f87171',
                boxShadow: '0 0 10px rgba(248, 113, 113, 0.35)',
              }}
            />
          ) : user?.name?.toLowerCase().includes('ben') ? (
            <img
              src="/mr_ben_sam.jpg"
              alt={user?.name || 'Mr. Ben Sam'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--bitnox-cyan)',
                boxShadow: '0 0 10px rgba(0, 210, 255, 0.35)',
              }}
            />
          ) : null}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
            <span
              className={`user-role-badge role-${role?.toLowerCase()}`}
              style={{ fontSize: '0.65rem' }}
            >
              {role}
            </span>
          </div>

          <button
            className="btn btn-danger btn-sm"
            onClick={logout}
            title="Sign out of Bitnox VMS"
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <SignOut size={14} weight="bold" />
            <span style={{ fontSize: '0.8rem' }}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
