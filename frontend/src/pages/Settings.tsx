import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SystemSettings } from '../types';
import {
  Gear,
  FloppyDisk,
  Clock,
  Buildings,
  Sparkle,
  Database,
  CheckCircle,
  WarningCircle,
  Archive,
} from '@phosphor-icons/react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [retentionMonths, setRetentionMonths] = useState<number>(24);
  const [autoArchive, setAutoArchive] = useState<boolean>(false);
  const [officeName, setOfficeName] = useState<string>('');
  const [techInstName, setTechInstName] = useState<string>('');
  const [dryCleanName, setDryCleanName] = useState<string>('');

  useEffect(() => {
    api.settings
      .get()
      .then((data) => {
        setSettings(data);
        setRetentionMonths(data.data_retention_months);
        setAutoArchive(data.auto_archive_enabled);
        setOfficeName(data.office_name);
        setTechInstName(data.tech_institute_name);
        setDryCleanName(data.dry_cleaning_name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await api.settings.update({
        data_retention_months: retentionMonths,
        auto_archive_enabled: autoArchive,
        office_name: officeName,
        tech_institute_name: techInstName,
        dry_cleaning_name: dryCleanName,
      });
      setSettings(updated);
      setStatusMessage({ type: 'success', text: 'System configuration saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>System Settings & Policies</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Data governance, retention lifespan, and organization branding
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle size={16} weight="bold" /> : <WarningCircle size={16} weight="bold" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Data Retention Period */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Clock size={18} color="var(--bitnox-cyan)" weight="bold" />
                <span>Visitor Data Retention Policy</span>
              </div>
              <div className="card-subtitle">
                Configure GDPR/compliance retention lifespan before records are flagged for archiving
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="retention-input">
              Retention Lifespan (Months)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                id="retention-input"
                type="number"
                min="1"
                max="120"
                className="form-control"
                style={{ width: '140px' }}
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(parseInt(e.target.value, 10) || 12)}
                required
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                months ({Math.round(retentionMonths / 12 * 10) / 10} years)
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Visitor entries older than this threshold will be tagged for archival export.
            </p>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              id="auto-archive-check"
              type="checkbox"
              checked={autoArchive}
              onChange={(e) => setAutoArchive(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--bitnox-cyan)', cursor: 'pointer' }}
            />
            <label htmlFor="auto-archive-check" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Enable Automated Nightly Archiving Routine (Background Job)
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '1.8rem', marginTop: '0.2rem' }}>
            When enabled, records past the retention limit are automatically consolidated into immutable compressed archives.
          </p>
        </div>

        {/* Card 2: Organization Names & Branding */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Buildings size={18} color="var(--clean-teal)" weight="duotone" />
                <span>Premises & Business Unit Branding</span>
              </div>
              <div className="card-subtitle">Labels displayed across reception banners, receipts, and export headers</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="office-name-input">
              Shared Reception Office Name
            </label>
            <input
              id="office-name-input"
              className="form-control"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tech-name-input">
                <Buildings size={14} color="var(--bitnox-cyan)" weight="duotone" /> Tech Institute Unit Name
              </label>
              <input
                id="tech-name-input"
                className="form-control"
                value={techInstName}
                onChange={(e) => setTechInstName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="clean-name-input">
                <Sparkle size={14} color="#2dd4bf" weight="duotone" /> Dry Cleaning Unit Name
              </label>
              <input
                id="clean-name-input"
                className="form-control"
                value={dryCleanName}
                onChange={(e) => setDryCleanName(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Card 3: Database & Engine Telemetry */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Database size={18} color="var(--text-muted)" weight="duotone" />
                <span>Database & Deployment Architecture</span>
              </div>
              <div className="card-subtitle">Engine connection status and compatibility</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Active ORM:</span> Prisma Client v6
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Current Engine:</span> SQLite (Drop-in PostgreSQL ready)
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Backend API:</span> Express REST (Port 5000)
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last Config Update:</span>{' '}
              {new Date(settings.updated_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <FloppyDisk size={18} weight="bold" />
            <span>{saving ? 'Saving Policy...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
