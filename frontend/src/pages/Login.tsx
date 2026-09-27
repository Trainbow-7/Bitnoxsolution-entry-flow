import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Buildings,
  Sparkle,
  Lock,
  Envelope,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  WarningCircle,
} from '@phosphor-icons/react';

interface LoginProps {
  onSuccess: (role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      onSuccess(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (
    roleKey: 'Admin' | 'Receptionist' | 'Staff-Alex' | 'Staff-Ben' | 'Staff-Usman' | 'Staff-Elena'
  ) => {
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await quickLogin(roleKey);
      onSuccess(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0b2246 0%, #060d1b 75%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(11, 23, 46, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 210, 255, 0.15)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bitnox-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-tech)',
            }}
          >
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#051326' }}>B</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--bitnox-cyan)' }}>
            Bitnox
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
            Visitor Management System
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1rem',
              background: 'var(--bg-surface-elevated)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--bitnox-cyan)', fontWeight: 600 }}>
              <Buildings size={14} weight="duotone" /> Tech Institute
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2dd4bf', fontWeight: 600 }}>
              <Sparkle size={14} weight="duotone" /> Dry Cleaning
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <WarningCircle size={16} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              <Envelope size={14} weight="bold" /> Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. receptionist@bitnox.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              <Lock size={14} weight="bold" /> Password
            </label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem', borderRadius: 'var(--radius-full)' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={18} weight="bold" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Section */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.85rem',
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
          >
            Or Click to Fast-Test by Role
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoClick('Receptionist')}
              disabled={loading}
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.75rem', gap: '0.6rem', minWidth: 0 }}
            >
              <img
                src="/receptionist.jpg"
                alt="Kikelomo Oluwanishola"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid var(--bitnox-cyan)',
                  flexShrink: 0,
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kikelomo O.</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--bitnox-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Receptionist</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoClick('Admin')}
              disabled={loading}
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.75rem', gap: '0.6rem', minWidth: 0 }}
            >
              <img
                src="/engr_oluwafemi.jpg"
                alt="Engr Oluwafemi Faleye"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #f87171',
                  flexShrink: 0,
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Engr Oluwafemi F.</div>
                <div style={{ fontSize: '0.7rem', color: '#f87171', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>CEO / Admin</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoClick('Staff-Alex')}
              disabled={loading}
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.75rem', gap: '0.6rem', minWidth: 0 }}
            >
              <img
                src="/mr_ben_sam.jpg"
                alt="Mr. Ben Sam"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid var(--bitnox-cyan)',
                  flexShrink: 0,
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mr. Ben Sam</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--bitnox-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI/ML Instructor</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoClick('Staff-Usman')}
              disabled={loading}
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.75rem', gap: '0.6rem', minWidth: 0 }}
            >
              <Briefcase size={18} color="var(--bitnox-cyan)" weight="duotone" style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mr. Oyeboade Usman O.</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--bitnox-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Data Analytics Instructor</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoClick('Staff-Elena')}
              disabled={loading}
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.75rem', gap: '0.6rem', minWidth: 0 }}
            >
              <Briefcase size={18} color="#2dd4bf" weight="duotone" style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Elena G.</div>
                <div style={{ fontSize: '0.7rem', color: '#2dd4bf', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Garment Lead • Clean</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
