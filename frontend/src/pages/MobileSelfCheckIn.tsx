import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Department, ExpectedDuration, PurposeOfVisit, Staff } from '../types';
import { broadcastCloudEvent } from '../utils/cloudSync';
import {
  Buildings,
  Sparkle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Envelope,
  WarningCircle,
  Question,
  CalendarBlank,
  CaretDown,
  ArrowRight,
  ShieldWarning,
  Lightning,
} from '@phosphor-icons/react';

interface MobileSelfCheckInProps {
  token: string;
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

export const MobileSelfCheckIn: React.FC<MobileSelfCheckInProps> = ({ token }) => {
  // Session validation state
  const [verifying, setVerifying] = useState<boolean>(true);
  const [sessionValid, setSessionValid] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Form data
  const [department, setDepartment] = useState<Department>('Tech Institute');
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [purposeOfVisit, setPurposeOfVisit] = useState<PurposeOfVisit>('Prospective Student');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffToSeeId, setStaffToSeeId] = useState<string>('');
  const [servicesRequested, setServicesRequested] = useState<string>('');
  const [expectedDuration, setExpectedDuration] = useState<ExpectedDuration>('15-30 min');
  const [remarks, setRemarks] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<any | null>(null);

  // 1. Verify token on load & fetch staff list
  useEffect(() => {
    let isMounted = true;
    setVerifying(true);

    api.checkinSessions
      .getStatus(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.valid) {
          setSessionValid(true);
          setStaffList(res.staff || []);
        } else {
          setSessionValid(false);
          setSessionError(
            res.error || 'This QR check-in session has expired. Please scan the current code at reception.'
          );
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setSessionValid(false);
        setSessionError(
          err.message || 'Unable to validate check-in session. Please scan the current QR code on the front-desk screen.'
        );
      })
      .finally(() => {
        if (isMounted) setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle department change
  const handleDeptChange = (newDept: Department) => {
    setDepartment(newDept);
    if (newDept === 'Tech Institute') {
      setPurposeOfVisit('Prospective Student');
    } else {
      setPurposeOfVisit('Dry Cleaning Customer');
    }
    setStaffToSeeId('');
  };

  const filteredStaff = staffList.filter((s) => s.department === department);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setSubmitError('Please enter a valid phone number.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await api.checkinSessions.submitSelfCheckIn(token, {
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

      setConfirmedData(res.visitor);

      // Broadcast immediately to front-desk terminal across all cloud/local networks
      if (res.visitor) {
        broadcastCloudEvent({
          type: 'NEW_VISITOR',
          visitor: res.visitor,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || 'Check-in failed. Please verify your details or ask reception.');
    } finally {
      setSubmitting(false);
    }
  };

  // State A: Loading / Verifying token
  if (verifying) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(0, 210, 255, 0.2)',
            borderTopColor: 'var(--bitnox-cyan)',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '1.25rem',
          }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connecting to Bitnox Check-In...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Verifying front-desk session token
        </p>
      </div>
    );
  }

  // State B: Expired / Invalid Session
  if (!sessionValid) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 1.75rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShieldWarning size={36} weight="duotone" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Check-In Code Expired
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {sessionError ||
              'For your security, front-desk QR codes refresh dynamically. Please scan the current code displayed on the reception screen.'}
          </p>

          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ width: '100%', borderRadius: 'var(--radius-full)' }}
          >
            Refresh & Try Again
          </button>
        </div>
      </div>
    );
  }

  // State C: Success Confirmation Screen (Proof of Check-In)
  if (confirmedData) {
    const arrivalTime = new Date(confirmedData.arrival_datetime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #0b2246 0%, #060d1b 80%)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 1.75rem',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 210, 255, 0.15)',
          }}
        >
          {/* Animated checkmark icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle size={42} weight="duotone" />
          </div>

          <span
            style={{
              display: 'inline-block',
              fontSize: '0.725rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--bitnox-cyan)',
              letterSpacing: '0.08em',
              background: 'var(--bitnox-cyan-subtle)',
              border: '1px solid var(--bitnox-cyan-border)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              marginBottom: '0.75rem',
            }}
          >
            Check-In Confirmed
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            You're checked in, {confirmedData.full_name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your arrival has been recorded live on the <strong>Reception Check-In Terminal</strong>.
          </p>

          {/* Dossier details card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Terminal:</span>
              <span style={{ color: 'var(--bitnox-cyan)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Lightning size={12} weight="fill" /> Reception Check-In Terminal
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Arrival Time:</span>
              <strong style={{ color: '#fff' }}>{arrivalTime}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Department:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: confirmedData.department === 'Tech Institute' ? 'var(--bitnox-cyan)' : '#2dd4bf',
                }}
              >
                {confirmedData.department}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Purpose:</span>
              <strong style={{ color: '#fff' }}>{confirmedData.purpose_of_visit}</strong>
            </div>

            {confirmedData.staff_to_see && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Host / Specialist:</span>
                <strong style={{ color: 'var(--bitnox-cyan)' }}>
                  {typeof confirmedData.staff_to_see === 'object'
                    ? confirmedData.staff_to_see.name
                    : confirmedData.staff_to_see}
                </strong>
              </div>
            )}
          </div>

          <div
            style={{
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            ✨ <strong>Please have a seat in the lobby</strong> — our team has been notified and you will be called shortly.
          </div>
        </div>
      </div>
    );
  }

  // State D: Interactive Mobile Check-In Form
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        padding: '1.25rem 1rem 3rem',
        maxWidth: '540px',
        margin: '0 auto',
      }}
    >
      {/* Mobile Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bitnox-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: 'var(--glow-tech)',
          }}
        >
          <span style={{ color: '#051326', fontWeight: 900, fontSize: '1.35rem' }}>B</span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--bitnox-cyan-subtle)',
            color: 'var(--bitnox-cyan)',
            border: '1px solid var(--bitnox-cyan-border)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.725rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.6rem',
          }}
        >
          <Lightning size={12} weight="fill" /> Live Front Desk Linked • Active Session
        </div>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
          Reception Check-In Terminal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Welcome! Please take your time to fill in your details accurately — your session has no rush or time limit.
        </p>
      </div>

      {submitError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <WarningCircle size={16} weight="bold" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Department Selection (Tap Cards) */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <Buildings size={15} color="var(--bitnox-cyan)" weight="duotone" /> Select Business Unit <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className={`dept-btn ${department === 'Tech Institute' ? 'active-tech' : ''}`}
              onClick={() => handleDeptChange('Tech Institute')}
              style={{ padding: '1rem 0.75rem', minHeight: '80px', textAlign: 'center' }}
            >
              <Buildings size={24} color={department === 'Tech Institute' ? 'var(--bitnox-cyan)' : 'currentColor'} weight="duotone" />
              <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>Tech Institute</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Courses & Labs</div>
            </button>

            <button
              type="button"
              className={`dept-btn ${department === 'Dry Cleaning' ? 'active-clean' : ''}`}
              onClick={() => handleDeptChange('Dry Cleaning')}
              style={{ padding: '1rem 0.75rem', minHeight: '80px', textAlign: 'center' }}
            >
              <Sparkle size={24} color={department === 'Dry Cleaning' ? '#2dd4bf' : 'currentColor'} weight="duotone" />
              <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>Dry Cleaning</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Garments & Pickup</div>
            </button>
          </div>
        </div>

        {/* Step 2: Personal Details */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="visitor-fullname">
              <User size={14} color="var(--bitnox-cyan)" weight="bold" /> Full Name <span className="required">*</span>
            </label>
            <input
              id="visitor-fullname"
              className="form-control"
              placeholder="e.g. Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="visitor-phone">
              <Phone size={14} color="var(--bitnox-cyan)" weight="bold" /> Phone Number <span className="required">*</span>
            </label>
            <input
              id="visitor-phone"
              type="tel"
              className="form-control"
              placeholder="e.g. +1 555-0199"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="visitor-email">
              <Envelope size={14} weight="bold" /> Email Address <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
            </label>
            <input
              id="visitor-email"
              type="email"
              className="form-control"
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Step 3: Purpose of Visit (Chip Pills) */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <Question size={14} color="var(--bitnox-cyan)" weight="bold" /> Purpose of Visit <span className="required">*</span>
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

        {/* Step 4: Host Staff Selection (Optional) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="staff-select">
            <User size={14} weight="bold" /> Staff Specialist to See{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
          </label>
          <select
            id="staff-select"
            className="form-control"
            value={staffToSeeId}
            onChange={(e) => setStaffToSeeId(e.target.value)}
          >
            <option value="">-- General Front Desk / Unassigned --</option>
            {filteredStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} {staff.role_title ? `(${staff.role_title})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Step 5: Expected Duration */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <Clock size={14} weight="bold" /> Estimated Visit Duration
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

        {/* Step 6: Services / Remarks (Optional) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="services-req">
            Services Requested / Remarks{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
          </label>
          <textarea
            id="services-req"
            className="form-control"
            placeholder={
              department === 'Tech Institute'
                ? 'e.g. Software Engineering course inquiry, lab demo...'
                : 'e.g. 2 Suits dry clean express, silk garments...'
            }
            value={servicesRequested}
            onChange={(e) => setServicesRequested(e.target.value)}
            rows={2}
          />
        </div>

        {/* Big Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            borderRadius: 'var(--radius-full)',
            padding: '1rem',
            fontSize: '1.05rem',
            fontWeight: 800,
          }}
        >
          {submitting ? (
            <span>Registering Arrival...</span>
          ) : (
            <>
              <span>Complete Check-In</span>
              <ArrowRight size={18} weight="bold" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
