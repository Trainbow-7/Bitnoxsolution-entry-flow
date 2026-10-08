import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Bitnox VMS ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = window.location.origin;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #0f172a, #030712)',
            color: '#f8fafc',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00D2FF 0%, #0072FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              B
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
              Bitnox VMS Terminal
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Click below to launch the live Receptionist Check-In terminal.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00D2FF 0%, #0072FF 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Open Receptionist Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
