import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  SquaresFour,
  UserPlus,
  Broadcast,
  FileText,
  ChartBar,
  Users,
  ShieldWarning,
  Gear,
  UserCheck,
  Buildings,
  ClockCounterClockwise,
} from '@phosphor-icons/react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  liveCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  liveCount,
}) => {
  const { user, role, isAdmin, isReceptionist, isStaff } = useAuth();

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (window.innerWidth <= 1024) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-logo">B</div>
          <div className="sidebar-brand-text">
            <h2 style={{ color: 'var(--bitnox-cyan)', fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
              Bitnox
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.02em' }}>
              Visitor Management
            </p>
          </div>
        </div>

        {/* Strictly Scoped Role Navigation Items */}
        <nav className="sidebar-nav">
          {/* 1. RECEPTIONIST NAVIGATION */}
          {isReceptionist && (
            <>
              <div className="sidebar-nav-heading">Reception & Front Desk</div>
              <button
                className={`nav-link ${currentTab === 'checkin' ? 'active' : ''}`}
                onClick={() => handleTabClick('checkin')}
              >
                <UserPlus size={18} weight="duotone" />
                <span>Visitor Check-In</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'currently-in-office' ? 'active' : ''}`}
                onClick={() => handleTabClick('currently-in-office')}
              >
                <Broadcast size={18} color="#f59e0b" weight="duotone" />
                <span>Currently In Office</span>
                {liveCount > 0 && <span className="badge-count">{liveCount}</span>}
              </button>

              <button
                className={`nav-link ${currentTab === 'visitor-log' ? 'active' : ''}`}
                onClick={() => handleTabClick('visitor-log')}
              >
                <FileText size={18} weight="duotone" />
                <span>Visitor History Log</span>
              </button>
            </>
          )}

          {/* 2. STAFF NAVIGATION */}
          {isStaff && (
            <>
              <div className="sidebar-nav-heading">Staff Workspace</div>
              <button
                className={`nav-link ${currentTab === 'my-visitors' ? 'active' : ''}`}
                onClick={() => handleTabClick('my-visitors')}
              >
                <UserCheck size={18} weight="duotone" />
                <span>My Visitors</span>
                {liveCount > 0 && <span className="badge-count">{liveCount}</span>}
              </button>

              <button
                className={`nav-link ${currentTab === 'my-visitor-history' ? 'active' : ''}`}
                onClick={() => handleTabClick('my-visitor-history')}
              >
                <ClockCounterClockwise size={18} weight="duotone" />
                <span>My Visit History</span>
              </button>
            </>
          )}

          {/* 3. ADMIN / CEO NAVIGATION (FULL VISIBILITY) */}
          {isAdmin && (
            <>
              <div className="sidebar-nav-heading">Executive Overview</div>
              <button
                className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabClick('dashboard')}
              >
                <SquaresFour size={18} weight="duotone" />
                <span>Executive Dashboard</span>
              </button>

              <div className="sidebar-nav-heading">Reception & Entry</div>
              <button
                className={`nav-link ${currentTab === 'checkin' ? 'active' : ''}`}
                onClick={() => handleTabClick('checkin')}
              >
                <UserPlus size={18} weight="duotone" />
                <span>Visitor Check-In</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'currently-in-office' ? 'active' : ''}`}
                onClick={() => handleTabClick('currently-in-office')}
              >
                <Broadcast size={18} color="#f59e0b" weight="duotone" />
                <span>Currently In Office</span>
                {liveCount > 0 && <span className="badge-count">{liveCount}</span>}
              </button>

              <button
                className={`nav-link ${currentTab === 'visitor-log' ? 'active' : ''}`}
                onClick={() => handleTabClick('visitor-log')}
              >
                <FileText size={18} weight="duotone" />
                <span>Visitor History Log</span>
              </button>

              <div className="sidebar-nav-heading">Staff Oversight</div>
              <button
                className={`nav-link ${currentTab === 'my-visitors' ? 'active' : ''}`}
                onClick={() => handleTabClick('my-visitors')}
              >
                <UserCheck size={18} weight="duotone" />
                <span>Staff Visitors Oversight</span>
              </button>

              <div className="sidebar-nav-heading">Analytics & Administration</div>
              <button
                className={`nav-link ${currentTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleTabClick('reports')}
              >
                <ChartBar size={18} weight="duotone" />
                <span>Reports & Exports</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'staff-mgmt' ? 'active' : ''}`}
                onClick={() => handleTabClick('staff-mgmt')}
              >
                <Buildings size={18} weight="duotone" />
                <span>Staff Directory</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'user-mgmt' ? 'active' : ''}`}
                onClick={() => handleTabClick('user-mgmt')}
              >
                <Users size={18} weight="duotone" />
                <span>User Accounts</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'audit-log' ? 'active' : ''}`}
                onClick={() => handleTabClick('audit-log')}
              >
                <ShieldWarning size={18} weight="duotone" />
                <span>Security Audit Log</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabClick('settings')}
              >
                <Gear size={18} weight="duotone" />
                <span>System Settings</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Sidebar Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="user-mini-profile">
          <div className="avatar" style={{ padding: 0, overflow: 'hidden' }}>
            {isReceptionist ? (
              <img
                src="/receptionist.jpg"
                alt="Kikelomo Oluwanishola"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (isAdmin || user?.name?.toLowerCase().includes('oluwafemi')) ? (
              <img
                src="/engr_oluwafemi.jpg"
                alt="Engr Oluwafemi Faleye"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : user?.name?.toLowerCase().includes('ben') ? (
              <img
                src="/mr_ben_sam.jpg"
                alt="Mr. Ben Sam"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <span className={`user-role-badge role-${role?.toLowerCase()}`}>
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
