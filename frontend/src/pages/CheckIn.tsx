import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Department, ExpectedDuration, PurposeOfVisit, Staff, Visitor } from '../types';
import { QRCodeView } from '../components/QRCodeView';
import {
  playCheckInChime,
  isAudioEnabled,
  setAudioEnabled,
  subscribeAudioState,
} from '../utils/audioChime';
import { subscribeCloudEvents, broadcastCloudEvent } from '../utils/cloudSync';
import {
  Buildings,
  Sparkle,
  CheckCircle,
  Clock,
  UserCheck,
  Phone,
  Envelope,
  User,
  Question,
  NotePencil,
  ArrowRight,
  QrCode,
  DeviceMobile,
  SpeakerHigh,
  SpeakerSlash,
  ArrowSquareOut,
  ArrowsClockwise,
  Broadcast,
  Copy,
  Check,
  Lightning,
  Globe,
} from '@phosphor-icons/react';

interface CheckInProps {
  onSuccessCheckIn?: (visitor: Visitor) => void;
  onNavigateToLive?: () => void;
}

const TECH_PURPOSES: PurposeOfVisit[] = [
  'Prospective Student',
  'Existing Trainee',
  'Business Partner',
  'Job Applicant',
  'Vendor',
  'Other',
];

const CLEAN_PURPOSES: PurposeOfVisit[] = [
  'Dry Cleaning Customer',
  'Business Partner',
  'Vendor',
  'Other',
];

const DURATION_OPTIONS: ExpectedDuration[] = ['<15 min', '15-30 min', '30-60 min', '1hr+'];

export const CheckIn: React.FC<CheckInProps> = ({ onSuccessCheckIn, onNavigateToLive }) => {
  // Terminal Mode: 'manual' | 'qr'
  const [checkInMode, setCheckInMode] = useState<'manual' | 'qr'>('manual');

  // Manual Form State
  const [department, setDepartment] = useState<Department>('Tech Institute');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState<PurposeOfVisit>('Prospective Student');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffToSeeId, setStaffToSeeId] = useState<string>('');
  const [servicesRequested, setServicesRequested] = useState('');
  const [expectedDuration, setExpectedDuration] = useState<ExpectedDuration>('15-30 min');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVisitor, setCreatedVisitor] = useState<Visitor | null>(null);

  // QR Self Check-In Kiosk State
  const [qrToken, setQrToken] = useState<string>('');
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [maxSeconds, setMaxSeconds] = useState<number>(300);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [recentSelfCheckins, setRecentSelfCheckins] = useState<Visitor[]>([]);
  const [highlightedVisitorId, setHighlightedVisitorId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isAudioEnabled());
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    return subscribeAudioState((enabled) => {
      setSoundEnabled(enabled);
    });
  }, []);

  // Network Host and Public Tunnel Detection for reachable QR codes
  const [serverLanIp, setServerLanIp] = useState<string>('');
  const [publicTunnelUrl, setPublicTunnelUrl] = useState<string>('');
  const [networkReachability, setNetworkReachability] = useState<'internet' | 'wifi'>('internet');
  const [customHost, setCustomHost] = useState<string>(() => localStorage.getItem('bitnox_kiosk_host') || '');
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);
  const [hostInput, setHostInput] = useState<string>(() => localStorage.getItem('bitnox_kiosk_host') || '');

  const eventSourceRef = useRef<EventSource | null>(null);

  // Load staff on mount & keep network info synced
  useEffect(() => {
    api.staff
      .getAll()
      .then((data) => {
        setStaffList(data);
      })
      .catch((err) => console.error('Failed to load staff list:', err));

    const syncNetwork = () => {
      api.checkinSessions
        .getNetworkInfo()
        .then((info: any) => {
          if (info.lan_ip) {
            setServerLanIp(info.lan_ip);
          }
          if (info.public_tunnel_url) {
            setPublicTunnelUrl(info.public_tunnel_url);
          }
        })
        .catch(() => {});
    };

    syncNetwork();
    const interval = setInterval(syncNetwork, 4000);
    return () => clearInterval(interval);
  }, []);

  // 1. QR Session Generator Function
  const generateNewQRSession = async (silent: boolean = false) => {
    if (!silent) setQrLoading(true);
    try {
      const res: any = await api.checkinSessions.createSession('reception-kiosk-1');
      setQrToken(res.token);
      if (res.lan_ip) {
        setServerLanIp(res.lan_ip);
      }
      if (res.public_tunnel_url) {
        setPublicTunnelUrl(res.public_tunnel_url);
      }
      const expDate = new Date(res.expires_at);
      setQrExpiresAt(expDate);
      const remaining = Math.max(1, Math.round((expDate.getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      setMaxSeconds(Math.max(remaining, 300));
    } catch (err) {
      console.error('Failed to generate QR check-in session:', err);
    } finally {
      if (!silent) setQrLoading(false);
    }
  };

  // 2. Fetch recent self-checkins
  const fetchRecentSelfCheckins = async () => {
    try {
      const recent = await api.checkinSessions.getRecent();
      setRecentSelfCheckins(recent);
    } catch (err) {
      console.error('Failed to load recent self check-ins:', err);
    }
  };

  // 3. Effect for QR Session and Countdown when in 'qr' mode
  useEffect(() => {
    if (checkInMode !== 'qr') {
      return;
    }

    // Generate first session immediately if none
    if (!qrToken) {
      generateNewQRSession();
    }
    fetchRecentSelfCheckins();

    // Stable 1-second countdown loop without tearing down on token changes
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 2) {
          generateNewQRSession(true);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkInMode]);

  // 4. Real-time SSE Stream, Cloud Relay Bridge & Polling for live self-checkin events
  useEffect(() => {
    // Process new visitor arrival
    const handleNewArrival = (newVis: Visitor) => {
      // Sound alert chime
      if (soundEnabled) {
        playCheckInChime();
      }

      // Highlight newly arrived visitor
      setHighlightedVisitorId(newVis.id);
      setTimeout(() => {
        setHighlightedVisitorId(null);
      }, 8000);

      // Prepend to recent list
      setRecentSelfCheckins((prev) => [
        newVis,
        ...prev.filter((v) => v.id !== newVis.id),
      ].slice(0, 10));

      // Increment on-premise counter if callback provided
      if (onSuccessCheckIn) {
        onSuccessCheckIn(newVis);
      }
    };

    // 1. Subscribe to Universal Cloud Relay (connects mobile phones worldwide)
    const unsubCloud = subscribeCloudEvents((payload) => {
      if (payload.type === 'NEW_VISITOR' && payload.visitor) {
        handleNewArrival(payload.visitor);
      }
    });

    // 2. Open Local Server-Sent Events stream
    const es = api.checkinSessions.createEventSource();
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_VISITOR' && data.visitor) {
          handleNewArrival(data.visitor);
        }
      } catch (err) {
        console.error('Error handling SSE event:', err);
      }
    };

    es.onerror = () => {
      // Browser will auto-reconnect SSE in background
    };

    // 3. Fallback polling every 3.5 seconds to ensure 100% sync
    const pollInterval = setInterval(() => {
      if (checkInMode === 'qr') {
        fetchRecentSelfCheckins();
      }
    }, 3500);

    return () => {
      unsubCloud();
      es.close();
      eventSourceRef.current = null;
      clearInterval(pollInterval);
    };
  }, [checkInMode, soundEnabled, onSuccessCheckIn]);

  // Sync default purpose when department changes
  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    if (newDept === 'Tech Institute') {
      setPurposeOfVisit('Prospective Student');
    } else {
      setPurposeOfVisit('Dry Cleaning Customer');
    }
    setStaffToSeeId('');
  };

  const filteredStaff = staffList.filter((s) => s.department === department);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Visitor Full Name and Phone Number are required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const visitor = await api.visitors.checkIn({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        email: email.trim() || undefined,
        department,
        purpose_of_visit: purposeOfVisit,
        staff_to_see_id: staffToSeeId || undefined,
        services_requested: servicesRequested.trim() || undefined,
        expected_duration: expectedDuration,
        remarks: remarks.trim() || undefined,
      });

      setCreatedVisitor(visitor);
      playCheckInChime();
      if (onSuccessCheckIn) {
        onSuccessCheckIn(visitor);
      }

      // Reset form
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setServicesRequested('');
      setRemarks('');
    } catch (err: any) {
      setError(err.message || 'Failed to check in visitor.');
    } finally {
      setLoading(false);
    }
  };

  const isCloudDomain = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const effectiveHost = (() => {
    if (customHost.trim()) return customHost.trim();
    if (publicTunnelUrl) {
      return publicTunnelUrl.replace(/^https?:\/\//, '');
    }
    if (isCloudDomain) {
      return window.location.host;
    }
    if (serverLanIp && serverLanIp !== '127.0.0.1' && serverLanIp !== 'localhost') {
      return `${serverLanIp}:${window.location.port || '5180'}`;
    }
    return window.location.host;
  })();

  // Full URL for QR code (points to Reception Check-In Terminal mobile self-service portal)
  const fullCheckInUrl = (() => {
    const tokenPart = qrToken || 'default';

    if (customHost.trim()) {
      const host = customHost.trim().replace(/\/+$/, '');
      const proto = host.startsWith('http') ? '' : `${window.location.protocol}//`;
      return `${proto}${host}/?session=${tokenPart}`;
    }

    if (networkReachability === 'internet' && publicTunnelUrl) {
      const tunnel = publicTunnelUrl.replace(/\/+$/, '');
      return `${tunnel}/?session=${tokenPart}`;
    }

    if (isCloudDomain) {
      return `${window.location.origin}/?session=${tokenPart}`;
    }

    return `${window.location.protocol}//${effectiveHost}/?session=${tokenPart}`;
  })();

  const copyQrLink = () => {
    navigator.clipboard.writeText(fullCheckInUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      {/* Top Header & Mode Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Reception Check-In Terminal</h1>
            {checkInMode === 'qr' && (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'var(--bitnox-cyan-subtle)',
                  color: 'var(--bitnox-cyan)',
                  border: '1px solid var(--bitnox-cyan-border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Lightning size={12} weight="fill" /> Kiosk Active
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Dual-mode terminal for staff manual entry and visitor contactless self-check-in
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            type="button"
            className={`chip ${checkInMode === 'manual' ? 'active' : ''}`}
            onClick={() => setCheckInMode('manual')}
            style={{
              border: 'none',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <NotePencil size={15} weight="bold" />
            <span>Manual Entry</span>
          </button>

          <button
            type="button"
            className={`chip ${checkInMode === 'qr' ? 'active' : ''}`}
            onClick={() => setCheckInMode('qr')}
            style={{
              border: 'none',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <QrCode size={15} weight="bold" />
            <span>QR Self Check-In</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODE 1: QR SELF CHECK-IN KIOSK
          ========================================================================= */}
      {checkInMode === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          {/* Main QR Card */}
          <div
            className="card"
            style={{
              padding: '2.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'radial-gradient(ellipse at top, #0d1e3d 0%, #0b172e 80%)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 210, 255, 0.1)',
            }}
          >
            {/* Sound alert toggle & test buttons */}
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => playCheckInChime(true)}
                style={{
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                }}
                title="Test front-desk chime sound"
              >
                <span>🔔 Test Chime</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAudioEnabled(!soundEnabled)}
                style={{
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  borderColor: soundEnabled ? 'var(--bitnox-cyan-border)' : 'var(--border-subtle)',
                  color: soundEnabled ? 'var(--bitnox-cyan)' : 'var(--text-muted)',
                }}
                title="Toggle front-desk audio chime on new check-in"
              >
                {soundEnabled ? <SpeakerHigh size={15} weight="bold" /> : <SpeakerSlash size={15} weight="bold" />}
                <span>{soundEnabled ? 'Chime On' : 'Chime Off'}</span>
              </button>
            </div>

            {/* Kiosk Instructions */}
            <div style={{ maxWidth: '520px', marginBottom: '1.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--bitnox-cyan)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem',
                }}
              >
                <DeviceMobile size={17} weight="duotone" /> Contactless Visitor Arrival
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                Scan With Your Phone to Check In
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.35rem' }}>
                Open your smartphone's camera, point it at the code below, and fill out your details. No app installation required.
              </p>
            </div>

            {/* Dynamic QR Code */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              {qrLoading ? (
                <div
                  style={{
                    width: 230,
                    height: 230,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <ArrowsClockwise size={28} className="spin" color="var(--bitnox-cyan)" />
                </div>
              ) : (
                <QRCodeView
                  value={fullCheckInUrl}
                  size={220}
                  fgColor="#050d1a"
                  bgColor="#ffffff"
                />
              )}
            </div>

            {/* Network Reachability Mode Selector: Any Internet (4G/5G) vs Local Wi-Fi */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-surface-elevated)',
                padding: '3px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem',
                gap: '4px',
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${networkReachability === 'internet' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setNetworkReachability('internet')}
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 14px',
                  fontSize: '0.78rem',
                  fontWeight: networkReachability === 'internet' ? 700 : 500,
                  boxShadow: networkReachability === 'internet' ? 'var(--glow-tech)' : 'none',
                }}
              >
                <span>🌐 Any Phone Internet (4G / 5G / LTE)</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${networkReachability === 'wifi' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setNetworkReachability('wifi')}
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 14px',
                  fontSize: '0.78rem',
                  fontWeight: networkReachability === 'wifi' ? 700 : 500,
                }}
              >
                <span>📶 Local Office Wi-Fi</span>
              </button>
            </div>

            {/* Network Guidance Banner */}
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: networkReachability === 'internet'
                  ? 'rgba(0, 210, 255, 0.07)'
                  : 'rgba(52, 211, 153, 0.08)',
                border: `1px solid ${networkReachability === 'internet' ? 'rgba(0, 210, 255, 0.35)' : 'rgba(52, 211, 153, 0.35)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.825rem',
                color: networkReachability === 'internet' ? '#e0f2fe' : '#e6fffa',
                textAlign: 'left',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: networkReachability === 'internet'
                    ? 'rgba(0, 210, 255, 0.18)'
                    : 'rgba(52, 211, 153, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '1.15rem',
                }}
              >
                {networkReachability === 'internet' ? '🌐' : '📶'}
              </div>
              <div style={{ lineHeight: 1.45 }}>
                {networkReachability === 'internet' ? (
                  <>
                    <strong style={{ color: 'var(--bitnox-cyan)' }}>Universal Phone Internet Active:</strong> Visitors can scan using their <strong>phone's normal 4G/5G mobile data</strong> — no office Wi-Fi connection or password needed!
                  </>
                ) : (
                  <>
                    <strong style={{ color: '#34d399' }}>Local Wi-Fi Mode:</strong> Phone must be connected to the same office Wi-Fi network (IP: {serverLanIp || '10.94.155.220'}).
                  </>
                )}
              </div>
            </div>

            {/* Expiry Progress Bar & Timer */}
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Code Security Refresh</span>
                <span style={{ color: secondsRemaining <= 10 ? '#f59e0b' : 'var(--bitnox-cyan)', fontWeight: 700 }}>
                  Refreshing in {secondsRemaining}s
                </span>
              </div>

              <div
                style={{
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(secondsRemaining / (maxSeconds || 300)) * 100}%`,
                    height: '100%',
                    background: secondsRemaining <= 10 ? '#f59e0b' : 'var(--bitnox-gradient)',
                    transition: 'width 1s linear',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>

            {/* Embedded Reception Check-In Terminal Target Card */}
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(0, 210, 255, 0.04)',
                border: '1px solid rgba(0, 210, 255, 0.22)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--bitnox-cyan)',
                  }}
                >
                  <Globe size={14} weight="bold" />
                  <span>EMBEDDED TARGET: RECEPTION CHECK-IN TERMINAL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingHost(!isEditingHost)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {isEditingHost ? 'Close' : 'Configure Host / IP'}
                </button>
              </div>

              {isEditingHost ? (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Embedded phone target (current: <strong>{effectiveHost}</strong>). If phones are on a different Wi-Fi, enter your computer IP or cloud tunnel:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                      placeholder={`e.g. ${serverLanIp || '10.94.155.220'}:5180`}
                      value={hostInput}
                      onChange={(e) => setHostInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const val = hostInput.trim();
                        setCustomHost(val);
                        localStorage.setItem('bitnox_kiosk_host', val);
                        setIsEditingHost(false);
                      }}
                    >
                      Save
                    </button>
                    {customHost && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCustomHost('');
                          setHostInput('');
                          localStorage.removeItem('bitnox_kiosk_host');
                          setIsEditingHost(false);
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      color: '#fff',
                      wordBreak: 'break-all',
                    }}
                  >
                    {fullCheckInUrl}
                  </span>
                  <button
                    type="button"
                    onClick={copyQrLink}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedLink ? '#34d399' : 'var(--bitnox-cyan)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {copiedLink ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Testing & Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={fullCheckInUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ gap: '0.4rem', boxShadow: 'var(--glow-tech)' }}
                title="Open Reception Check-In Terminal in a new browser tab"
              >
                <ArrowSquareOut size={15} weight="bold" />
                <span>Open Reception Check-In Terminal</span>
              </a>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyQrLink}
                style={{ gap: '0.4rem' }}
              >
                {copiedLink ? <Check size={15} color="#34d399" weight="bold" /> : <Copy size={15} weight="bold" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Terminal Link'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => generateNewQRSession()}
                disabled={qrLoading}
                style={{ gap: '0.4rem' }}
                title="Force generate fresh QR token"
              >
                <ArrowsClockwise size={15} className={qrLoading ? 'spin' : ''} weight="bold" />
                <span>Refresh Terminal Code</span>
              </button>
            </div>
          </div>

          {/* Real-time Incoming Mini List */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot cyan" />
                <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
                  Live Self-Check-In Feed
                </h3>
                <span className="badge badge-tech" style={{ fontSize: '0.7rem', padding: '1px 7px' }}>
                  Real-Time Push
                </span>
              </div>

              {onNavigateToLive && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onNavigateToLive}
                  style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <Broadcast size={14} color="#f59e0b" weight="bold" />
                  <span>View All In Office</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              )}
            </div>

            {recentSelfCheckins.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                <DeviceMobile size={32} weight="duotone" style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
                <p>Awaiting incoming visitor self-check-ins...</p>
                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                  Visitors who scan the QR code will appear here instantly without a page refresh.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Department</th>
                      <th>Purpose</th>
                      <th>Staff Member</th>
                      <th>Arrival Time</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSelfCheckins.map((visitor) => {
                      const isNew = highlightedVisitorId === visitor.id;
                      const isTech = visitor.department === 'Tech Institute';
                      const arrivalTime = new Date(visitor.arrival_datetime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr
                          key={visitor.id}
                          style={{
                            background: isNew ? 'rgba(0, 210, 255, 0.14)' : undefined,
                            transition: 'background 0.5s ease',
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ color: isNew ? 'var(--bitnox-cyan)' : '#fff' }}>
                                {visitor.full_name}
                              </strong>
                              {isNew && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    background: 'var(--bitnox-cyan)',
                                    color: '#051326',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  JUST NOW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {visitor.phone_number}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`}>
                              {isTech ? <Buildings size={12} weight="duotone" /> : <Sparkle size={12} weight="duotone" />}
                              <span>{visitor.department}</span>
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>{visitor.purpose_of_visit}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: visitor.staff_to_see ? 'var(--bitnox-cyan)' : 'var(--text-muted)',
                              }}
                            >
                              {visitor.staff_to_see?.name || 'General Reception'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                              {arrivalTime}
                            </span>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(0, 210, 255, 0.1)',
                                color: 'var(--bitnox-cyan)',
                                border: '1px solid var(--bitnox-cyan-border)',
                                fontSize: '0.7rem',
                              }}
                            >
                              <QrCode size={12} weight="bold" />
                              <span>QR Mobile</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: MANUAL ENTRY (Original Flow Preserved)
          ========================================================================= */}
      {checkInMode === 'manual' && (
        <div style={{ marginTop: '0.5rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                color: '#f87171',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="card" style={{ padding: '2rem' }}>
            <form onSubmit={handleManualSubmit}>
              {/* Step 1: Select Business Unit / Department */}
              <label className="form-label" style={{ marginBottom: '0.75rem' }}>
                <Buildings size={16} weight="duotone" /> Select Business Department <span className="required">*</span>
              </label>
              <div className="dept-switch">
                <button
                  type="button"
                  className={`dept-btn ${department === 'Tech Institute' ? 'active-tech' : ''}`}
                  onClick={() => handleDepartmentChange('Tech Institute')}
                >
                  <Buildings
                    size={26}
                    weight="duotone"
                    color={department === 'Tech Institute' ? 'var(--bitnox-cyan)' : 'currentColor'}
                  />
                  <div className="dept-btn-title">Technology Training Institute</div>
                  <div className="dept-btn-subtitle">Bootcamp • Courses • Student Advising • Labs</div>
                </button>

                <button
                  type="button"
                  className={`dept-btn ${department === 'Dry Cleaning' ? 'active-clean' : ''}`}
                  onClick={() => handleDepartmentChange('Dry Cleaning')}
                >
                  <Sparkle size={26} weight="duotone" color={department === 'Dry Cleaning' ? '#2dd4bf' : 'currentColor'} />
                  <div className="dept-btn-title">Dry Cleaning Service</div>
                  <div className="dept-btn-subtitle">Garments • Silk/Wool • Express Laundry • Pickups</div>
                </button>
              </div>

              {/* Step 2: Visitor Primary Info */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="visitor-name">
                    <User size={14} weight="bold" /> Visitor Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="visitor-name"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="visitor-phone">
                    <Phone size={14} weight="bold" /> Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="visitor-phone"
                    className="form-control"
                    placeholder="e.g. +1 555-0123"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="visitor-email">
                    <Envelope size={14} weight="bold" /> Email Address <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span>
                  </label>
                  <input
                    id="visitor-email"
                    type="email"
                    className="form-control"
                    placeholder="e.g. john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="staff-member">
                    <UserCheck size={14} weight="bold" /> Staff Member to See <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span>
                  </label>
                  <select
                    id="staff-member"
                    className="form-control"
                    value={staffToSeeId}
                    onChange={(e) => setStaffToSeeId(e.target.value)}
                  >
                    <option value="">-- General Inquiries / Front Desk --</option>
                    {filteredStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} {staff.role_title ? `(${staff.role_title})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Purpose of Visit Chips */}
              <div className="form-group">
                <label className="form-label">
                  <Question size={14} weight="bold" /> Purpose of Visit <span className="required">*</span>
                </label>
                <div className="chip-group">
                  {(department === 'Tech Institute' ? TECH_PURPOSES : CLEAN_PURPOSES).map((purpose) => (
                    <button
                      key={purpose}
                      type="button"
                      className={`chip ${purposeOfVisit === purpose ? 'active' : ''}`}
                      onClick={() => setPurposeOfVisit(purpose)}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Expected Duration & Services Requested */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} weight="bold" /> Expected Duration
                  </label>
                  <div className="chip-group">
                    {DURATION_OPTIONS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        className={`chip ${expectedDuration === dur ? 'active' : ''}`}
                        onClick={() => setExpectedDuration(dur)}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="services-requested">
                    Services Requested / Garment Notes
                  </label>
                  <textarea
                    id="services-requested"
                    className="form-control"
                    placeholder={
                      department === 'Tech Institute'
                        ? 'e.g. Inquiring about Cybersecurity Diploma, Full-Stack cohort...'
                        : 'e.g. 3 Suits, 2 Dresses (Dry cleaning express pickup)...'
                    }
                    value={servicesRequested}
                    onChange={(e) => setServicesRequested(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="form-group">
                <label className="form-label" htmlFor="reception-remarks">
                  Reception Notes / Remarks <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Internal)</span>
                </label>
                <input
                  id="reception-remarks"
                  className="form-control"
                  placeholder="e.g. Visitor is seated at reception lobby sofa A"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setFullName('');
                    setPhoneNumber('');
                    setEmail('');
                    setServicesRequested('');
                    setRemarks('');
                  }}
                  disabled={loading}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ minWidth: '220px' }}
                >
                  {loading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Check In Visitor</span>
                      <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Manual Check-In */}
      {createdVisitor && (
        <div className="modal-overlay" onClick={() => setCreatedVisitor(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ padding: '2rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle size={36} weight="duotone" />
              </div>

              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Visitor Checked In!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{createdVisitor.full_name}</strong> is now registered on premises for{' '}
                <span style={{ color: createdVisitor.department === 'Tech Institute' ? 'var(--bitnox-cyan)' : '#2dd4bf', fontWeight: 600 }}>
                  {createdVisitor.department}
                </span>.
              </p>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Purpose:</span> {createdVisitor.purpose_of_visit}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Staff Assigned:</span>{' '}
                  {createdVisitor.staff_to_see?.name || 'General Reception'}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Duration:</span>{' '}
                  {createdVisitor.expected_duration || 'Not specified'}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                  <span className="badge badge-in-progress" style={{ padding: '1px 6px' }}>In Progress</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCreatedVisitor(null)}
                >
                  Check In Another
                </button>

                {onNavigateToLive && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setCreatedVisitor(null);
                      onNavigateToLive();
                    }}
                  >
                    <span>View Currently in Office</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
