import React, { useState, useEffect } from 'react';
import { OverstayAlertData } from '../types';
import { playOverdueAlertSound } from '../utils/audioChime';
import {
  Warning,
  Clock,
  User,
  Buildings,
  Sparkle,
  CheckCircle,
  X,
  CaretRight,
  CaretLeft,
  Phone,
  ShieldWarning,
} from '@phosphor-icons/react';

interface OverstayAlertModalProps {
  alerts: OverstayAlertData[];
  onCheckOut: (visitorId: string) => Promise<void>;
  onDismiss: (visitorId: string) => void;
  onDismissAll: () => void;
}

export const OverstayAlertModal: React.FC<OverstayAlertModalProps> = ({
  alerts,
  onCheckOut,
  onDismiss,
  onDismissAll,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      playOverdueAlertSound();
    }
  }, [alerts.length]);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Ensure index remains in bounds if alerts are removed
  const safeIndex = Math.min(currentIndex, alerts.length - 1);
  const currentAlert = alerts[safeIndex];
  const { visitor, elapsed_minutes, threshold_minutes, overdue_minutes } = currentAlert;

  const isTech = visitor.department === 'Tech Institute';
  const arrivalDate = new Date(visitor.arrival_datetime);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCheckOutClick = async () => {
    setIsProcessing(true);
    try {
      await onCheckOut(visitor.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(180deg, #111b2b 0%, #080f1d 100%)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.22)',
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.9rem',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.35)',
              }}
            >
              <Warning size={20} weight="fill" className="pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    color: '#f87171',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Visitor Overstay Alert
                </span>
                {alerts.length > 1 && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {safeIndex + 1} of {alerts.length}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Expected Duration Exceeded
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(visitor.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Dismiss popup for this visitor"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Highlighted Overstay Time Alert Box */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={20} color="#f87171" weight="bold" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>
                Elapsed Time on Premises
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {elapsed_minutes} minutes
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Expected Limit: <strong>{visitor.expected_duration || `${threshold_minutes} min`}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f87171' }}>
              +{Math.max(1, overdue_minutes || (elapsed_minutes - threshold_minutes))} min overdue
            </div>
          </div>
        </div>

        {/* Visitor Dossier Card */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          {/* Visitor Name & Department */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {visitor.full_name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.15rem',
                }}
              >
                <Phone size={12} weight="bold" />
                <span>{visitor.phone_number}</span>
              </div>
            </div>

            <span className={`badge ${isTech ? 'badge-tech' : 'badge-dryclean'}`}>
              {isTech ? <Buildings size={12} weight="duotone" /> : <Sparkle size={12} weight="duotone" />}
              <span>{visitor.department}</span>
            </span>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.825rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Purpose: </span>
              <strong style={{ color: '#fff' }}>{visitor.purpose_of_visit}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Host / Staff: </span>
              <strong style={{ color: visitor.staff_to_see ? 'var(--bitnox-cyan)' : 'var(--text-muted)' }}>
                {typeof visitor.staff_to_see === 'string'
                  ? visitor.staff_to_see
                  : visitor.staff_to_see?.name || 'General Reception'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Checked In: </span>
              <span style={{ color: '#fff' }}>{arrivalTimeStr}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Method: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{visitor.check_in_method || 'Reception Entry'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleCheckOutClick}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                padding: '0.65rem 1rem',
              }}
            >
              <CheckCircle size={16} weight="bold" />
              <span>{isProcessing ? 'Checking Out...' : 'Check Out Now'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onDismiss(visitor.id)}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
              }}
            >
              <span>Dismiss / Still Here</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '0.4rem',
            }}
          >
            <span>
              ℹ️ Dismissing hides this popup. Red <strong>"Overstayed"</strong> badge stays in office lists until checked out.
            </span>

            {alerts.length > 1 && (
              <button
                type="button"
                onClick={onDismissAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                  marginLeft: '0.5rem',
                }}
              >
                Dismiss All ({alerts.length})
              </button>
            )}
          </div>
        </div>

        {/* Multi-visitor navigation pagination */}
        {alerts.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={safeIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              style={{ padding: '0.2rem 0.5rem' }}
            >
              <CaretLeft size={16} weight="bold" />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Overstay {safeIndex + 1} of {alerts.length}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={safeIndex >= alerts.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(alerts.length - 1, prev + 1))}
              style={{ padding: '0.2rem 0.5rem' }}
            >
              <span>Next</span>
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
