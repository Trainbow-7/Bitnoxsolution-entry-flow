import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CheckIn } from './pages/CheckIn';
import { CurrentlyInOffice } from './pages/CurrentlyInOffice';
import { MyVisitors } from './pages/MyVisitors';
import { VisitorLog } from './pages/VisitorLog';
import { Reports } from './pages/Reports';
import { StaffManagement } from './pages/StaffManagement';
import { UserManagement } from './pages/UserManagement';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import { MobileSelfCheckIn } from './pages/MobileSelfCheckIn';
import { OverstayAlertModal } from './components/OverstayAlertModal';
import { playCheckInChime, playOverdueAlertSound } from './utils/audioChime';
import { subscribeCloudEvents } from './utils/cloudSync';
import { api } from './api/client';
import { UserRole, OverstayAlertData } from './types';
import { ShieldWarning } from '@phosphor-icons/react';

function getSessionTokenFromUrl(): string | null {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // 1. Check pathname: /checkin/session/:token or /self-checkin/:token
  const pathMatch = path.match(/\/(?:checkin\/session|self-checkin)\/([a-zA-Z0-9_-]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // 2. Check hash: #/checkin/session/:token or #checkin/session/:token or #/self-checkin/:token
  const hashMatch = hash.match(/(?:checkin\/session|self-checkin)\/([a-zA-Z0-9_-]+)/);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1];
  }

  // 3. Check query param: ?session=token, ?token=token, ?s=token
  const searchParams = new URLSearchParams(window.location.search);
  const sessionParam = searchParams.get('token') || searchParams.get('session') || searchParams.get('s');
  if (sessionParam) {
    return sessionParam;
  }

  // 4. Check hash query params: #/self-checkin?token=...
  if (hash.includes('?')) {
    const hashQuery = hash.split('?')[1];
    const hashParams = new URLSearchParams(hashQuery);
    const hashToken = hashParams.get('token') || hashParams.get('session') || hashParams.get('s');
    if (hashToken) {
      return hashToken;
    }
  }

  return null;
}

// Role-Based Screen Access Matrix
const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  Receptionist: ['checkin', 'currently-in-office', 'visitor-log'],
  Staff: ['my-visitors', 'my-visitor-history'],
  Admin: [
    'dashboard',
    'checkin',
    'currently-in-office',
    'visitor-log',
    'my-visitors',
    'reports',
    'staff-mgmt',
    'user-mgmt',
    'audit-log',
    'settings',
  ],
};

const ROLE_DEFAULT_TAB: Record<UserRole, string> = {
  Receptionist: 'checkin',
  Staff: 'my-visitors',
  Admin: 'dashboard',
};

function normalizeTabFromUrl(): string | null {
  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (hash) {
    if (hash.startsWith('checkin/session')) return null;
    if (hash === 'admin/dashboard' || hash === 'dashboard') return 'dashboard';
    if (hash === 'checkin' || hash === 'entry') return 'checkin';
    if (hash === 'currently-in-office' || hash === 'live') return 'currently-in-office';
    if (hash === 'visitor-log' || hash === 'history') return 'visitor-log';
    if (hash === 'my-visitors' || hash === 'my-visitors/active' || hash === 'visitors') return 'my-visitors';
    if (hash === 'my-visitor-history' || hash === 'my-visitors/history') return 'my-visitor-history';
    if (hash === 'admin/reports' || hash === 'reports') return 'reports';
    if (hash === 'admin/staff' || hash === 'staff' || hash === 'staff-mgmt') return 'staff-mgmt';
    if (hash === 'admin/users' || hash === 'users' || hash === 'user-mgmt') return 'user-mgmt';
    if (hash === 'admin/audit' || hash === 'audit' || hash === 'audit-log') return 'audit-log';
    if (hash === 'admin/settings' || hash === 'settings') return 'settings';
    return hash;
  }

  const path = window.location.pathname.replace(/^\//, '').trim().toLowerCase();
  if (path) {
    if (path.startsWith('checkin/session')) return null;
    if (path === 'admin/dashboard' || path === 'dashboard') return 'dashboard';
    if (path === 'checkin' || path === 'entry') return 'checkin';
    if (path === 'currently-in-office' || path === 'live') return 'currently-in-office';
    if (path === 'visitor-log' || path === 'history') return 'visitor-log';
    if (path === 'my-visitors') return 'my-visitors';
    if (path === 'my-visitor-history') return 'my-visitor-history';
    if (path === 'admin/reports' || path === 'reports') return 'reports';
    if (path === 'admin/staff' || path === 'staff' || path === 'staff-mgmt') return 'staff-mgmt';
    if (path === 'admin/users' || path === 'users' || path === 'user-mgmt') return 'user-mgmt';
    if (path === 'admin/audit' || path === 'audit' || path === 'audit-log') return 'audit-log';
    if (path === 'admin/settings' || path === 'settings') return 'settings';
  }

  return null;
}

const MainApp: React.FC = () => {
  const { user, role, loading, isAdmin, isReceptionist, isStaff } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const urlTab = normalizeTabFromUrl();
    if (urlTab) return urlTab;
    if (role) return ROLE_DEFAULT_TAB[role] || 'checkin';
    return '';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const accessDeniedTimerRef = useRef<any>(null);

  // Overstay alerts state & real-time monitoring (Receptionist & Admin only)
  const [overstayAlerts, setOverstayAlerts] = useState<OverstayAlertData[]>([]);
  const dismissedOverstayIdsRef = useRef<Set<string>>(new Set());

  // Navigation and Direct URL Access Guard
  const navigateTab = useCallback(
    (targetTab: string, isExternalOrUrl: boolean = false) => {
      if (!role) return;

      const allowedTabs = ROLE_ALLOWED_TABS[role] || [];
      const defaultTab = ROLE_DEFAULT_TAB[role] || 'checkin';

      // Verify if target tab is permitted for current role
      if (!allowedTabs.includes(targetTab)) {
        // Reject and redirect to default landing tab with warning message
        setCurrentTab(defaultTab);
        window.history.replaceState(null, '', `#${defaultTab}`);

        const displayTabName = targetTab.replace(/-/g, ' ');
        setAccessDeniedMessage(
          `You don't have access to that page ("${displayTabName}"). Redirected to your authorized workspace.`
        );

        if (accessDeniedTimerRef.current) clearTimeout(accessDeniedTimerRef.current);
        accessDeniedTimerRef.current = setTimeout(() => {
          setAccessDeniedMessage(null);
        }, 5000);
        return;
      }

      // Allowed tab access
      setCurrentTab(targetTab);
      setAccessDeniedMessage(null);
      if (!isExternalOrUrl) {
        window.history.pushState(null, '', `#${targetTab}`);
      }
    },
    [role]
  );

  // Sync tab on mount, role change, and URL popstate/hashchange
  useEffect(() => {
    if (!role) return;

    const requestedTab = normalizeTabFromUrl();
    if (requestedTab) {
      navigateTab(requestedTab, true);
    } else {
      navigateTab(ROLE_DEFAULT_TAB[role], true);
    }

    const handleHashOrPop = () => {
      const urlTab = normalizeTabFromUrl();
      if (urlTab) {
        navigateTab(urlTab, true);
      }
    };

    window.addEventListener('hashchange', handleHashOrPop);
    window.addEventListener('popstate', handleHashOrPop);
    return () => {
      window.removeEventListener('hashchange', handleHashOrPop);
      window.removeEventListener('popstate', handleHashOrPop);
    };
  }, [role, navigateTab]);

  // Tracking sets for real-time arrival and overstay sound triggers
  const knownVisitorIdsRef = useRef<Set<string> | null>(null);
  const alertedOverstayIdsRef = useRef<Set<string>>(new Set());

  // Real-time visitor polling & arrival chime detector (Receptionist, Admin, & Staff assigned visitors)
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const syncLiveVisitors = async () => {
      try {
        let activeList: any[] = [];
        if (isStaff) {
          const res = await api.visitors.getMyVisitors({
            status: 'In Progress',
            staff_to_see_id: user.linked_staff_id || 'staff-ben',
          });
          activeList = res.visitors || [];
        } else {
          activeList = await api.visitors.getCurrentlyInOffice();
        }

        if (!isSubscribed) return;
        setLiveCount(activeList.length);

        if (knownVisitorIdsRef.current === null) {
          // Initial mount: record existing visitor IDs without chiming
          knownVisitorIdsRef.current = new Set(activeList.map((v) => v.id));
        } else {
          // Subsequent checks: detect newly checked-in visitors
          const newVisitors = activeList.filter((v) => !knownVisitorIdsRef.current!.has(v.id));
          if (newVisitors.length > 0) {
            newVisitors.forEach((v) => knownVisitorIdsRef.current!.add(v.id));
            playCheckInChime();
          }
        }
      } catch (err) {
        // Silently retry on next poll cycle
      }
    };

    syncLiveVisitors();
    const interval = setInterval(syncLiveVisitors, 3500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user, isAdmin, isReceptionist, isStaff]);

  // Real-time Overstay Alerts detector & audio chime (Receptionist & Admin only)
  useEffect(() => {
    if (!user || (!isAdmin && !isReceptionist)) return;

    let isSubscribed = true;

    const syncOverstayAlerts = async () => {
      try {
        const alerts = await api.visitors.getOverstayAlerts();
        if (!isSubscribed) return;

        const unDismissed = alerts.filter(
          (item) => !dismissedOverstayIdsRef.current.has(item.visitor.id)
        );

        if (unDismissed.length > 0) {
          // Check if any overdue visitor has not been alerted with audio yet
          const unAlerted = unDismissed.filter(
            (item) => !alertedOverstayIdsRef.current.has(item.visitor.id)
          );

          if (unAlerted.length > 0) {
            unAlerted.forEach((item) => alertedOverstayIdsRef.current.add(item.visitor.id));
            playOverdueAlertSound();
          }
        }

        setOverstayAlerts(unDismissed);
      } catch (err) {
        console.error('Failed to sync overstay alerts in MainApp:', err);
      }
    };

    syncOverstayAlerts();
    const interval = setInterval(syncOverstayAlerts, 4000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user, isAdmin, isReceptionist]);

  // Real-time SSE stream listener, Cloud Relay Bridge & Window/Storage events for multi-tab/device sync
  useEffect(() => {
    if (!user || (!isAdmin && !isReceptionist)) return;

    const handleIncomingVisitor = (visitor: any) => {
      if (!visitor) return;
      if (knownVisitorIdsRef.current) {
        knownVisitorIdsRef.current.add(visitor.id);
      }
      playCheckInChime();
      setLiveCount((c) => c + 1);
    };

    const handleIncomingOverstay = (data: any) => {
      if (!data || !data.visitor) return;
      if (dismissedOverstayIdsRef.current.has(data.visitor.id)) return;

      if (!alertedOverstayIdsRef.current.has(data.visitor.id)) {
        alertedOverstayIdsRef.current.add(data.visitor.id);
        playOverdueAlertSound();
      }

      setOverstayAlerts((prev) => {
        const exists = prev.some((a) => a.visitor.id === data.visitor.id);
        if (exists) {
          return prev.map((a) => (a.visitor.id === data.visitor.id ? data : a));
        }
        return [data, ...prev];
      });
    };

    // 1. Universal Cloud Relay (connects mobile phones worldwide directly)
    const unsubCloud = subscribeCloudEvents((payload) => {
      if (payload.type === 'NEW_VISITOR' && payload.visitor) {
        handleIncomingVisitor(payload.visitor);
      } else if (payload.type === 'OVERSTAY_ALERT') {
        handleIncomingOverstay(payload);
      }
    });

    // 2. Server-Sent Events stream
    const es = api.checkinSessions.createEventSource();

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_VISITOR' && data.visitor) {
          handleIncomingVisitor(data.visitor);
        } else if (data.type === 'OVERSTAY_ALERT' && data.visitor) {
          handleIncomingOverstay(data);
        }
      } catch (err) {
        console.error('Error handling SSE event in MainApp:', err);
      }
    };

    // 3. Custom Window Event listener (instant trigger within same window)
    const handleCustomNewVisitor = (e: any) => {
      const visitor = e.detail?.visitor;
      if (visitor) {
        handleIncomingVisitor(visitor);
      }
    };
    window.addEventListener('bitnox_new_visitor', handleCustomNewVisitor);

    // 4. Storage Event listener (instant cross-tab sync when another tab checks in)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bitnox_last_visitor' && e.newValue) {
        try {
          const vis = JSON.parse(e.newValue);
          if (vis && vis.id) {
            handleIncomingVisitor(vis);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubCloud();
      es.close();
      window.removeEventListener('bitnox_new_visitor', handleCustomNewVisitor);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, isAdmin, isReceptionist]);

  const handleCheckOutOverstay = async (visitorId: string) => {
    try {
      await api.visitors.checkOut(visitorId, 'Checked out via Overstay Alert prompt');
      dismissedOverstayIdsRef.current.add(visitorId);
      setOverstayAlerts((prev) => prev.filter((a) => a.visitor.id !== visitorId));
      setLiveCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to check out visitor.');
    }
  };

  const handleDismissOverstay = (visitorId: string) => {
    dismissedOverstayIdsRef.current.add(visitorId);
    setOverstayAlerts((prev) => prev.filter((a) => a.visitor.id !== visitorId));
  };

  const handleDismissAllOverstay = () => {
    overstayAlerts.forEach((a) => dismissedOverstayIdsRef.current.add(a.visitor.id));
    setOverstayAlerts([]);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
        }}
      >
        Connecting to Bitnox VMS Secure Core...
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!user || !role) {
    return (
      <Login
        onSuccess={(loggedRole) => {
          const defaultTab = ROLE_DEFAULT_TAB[loggedRole as UserRole] || 'checkin';
          navigateTab(defaultTab, true);
        }}
      />
    );
  }

  // Strictly enforce role-rendered views
  const getRenderedContent = () => {
    // 1. RECEPTIONIST SCREENS
    if (isReceptionist) {
      switch (currentTab) {
        case 'checkin':
          return (
            <CheckIn
              onNavigateToLive={() => navigateTab('currently-in-office')}
              onSuccessCheckIn={() => setLiveCount((c) => c + 1)}
            />
          );
        case 'currently-in-office':
          return <CurrentlyInOffice onCountChange={setLiveCount} />;
        case 'visitor-log':
          return <VisitorLog />;
        default:
          return (
            <CheckIn
              onNavigateToLive={() => navigateTab('currently-in-office')}
              onSuccessCheckIn={() => setLiveCount((c) => c + 1)}
            />
          );
      }
    }

    // 2. STAFF SCREENS (Scoped strictly to own assigned visitors)
    if (isStaff) {
      switch (currentTab) {
        case 'my-visitors':
          return <MyVisitors mode="active" />;
        case 'my-visitor-history':
          return <MyVisitors mode="history" />;
        default:
          return <MyVisitors mode="active" />;
      }
    }

    // 3. ADMIN / CEO SCREENS (Full unrestricted visibility)
    if (isAdmin) {
      switch (currentTab) {
        case 'dashboard':
          return <Dashboard onNavigateToTab={navigateTab} />;
        case 'checkin':
          return (
            <CheckIn
              onNavigateToLive={() => navigateTab('currently-in-office')}
              onSuccessCheckIn={() => setLiveCount((c) => c + 1)}
            />
          );
        case 'currently-in-office':
          return <CurrentlyInOffice onCountChange={setLiveCount} />;
        case 'visitor-log':
          return <VisitorLog />;
        case 'my-visitors':
          return <MyVisitors mode="all" onNavigateToDashboard={() => navigateTab('dashboard')} />;
        case 'reports':
          return <Reports />;
        case 'staff-mgmt':
          return <StaffManagement />;
        case 'user-mgmt':
          return <UserManagement />;
        case 'audit-log':
          return <AuditLog />;
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard onNavigateToTab={navigateTab} />;
      }
    }

    return <div className="page-wrapper">Unauthorized Role State</div>;
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => navigateTab(tab)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        liveCount={liveCount}
      />

      <div className="main-content">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentTab={currentTab}
        />

        {/* Access Denied Warning Toast / Banner */}
        {accessDeniedMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              margin: '1rem 1.5rem 0',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fca5a5',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldWarning size={18} color="#ef4444" weight="bold" />
              <span>{accessDeniedMessage}</span>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                fontSize: '1.25rem',
                lineHeight: 1,
                padding: '0 0.25rem',
              }}
              title="Dismiss warning"
            >
              &times;
            </button>
          </div>
        )}

        {getRenderedContent()}
      </div>

      {/* Real-time Overstay Alert Modal: Receptionist & Admin only */}
      {(isAdmin || isReceptionist) && (
        <OverstayAlertModal
          alerts={overstayAlerts}
          onCheckOut={handleCheckOutOverstay}
          onDismiss={handleDismissOverstay}
          onDismissAll={handleDismissAllOverstay}
        />
      )}
    </div>
  );
};

export default function App() {
  const [sessionToken, setSessionToken] = useState<string | null>(() => getSessionTokenFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      setSessionToken(getSessionTokenFromUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // If visiting via QR code or direct self-checkin session link, bypass all auth & internal shell
  if (sessionToken) {
    return <MobileSelfCheckIn token={sessionToken} />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
