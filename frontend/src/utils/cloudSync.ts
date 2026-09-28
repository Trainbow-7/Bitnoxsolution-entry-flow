/**
 * Bitnox VMS Universal Multi-Channel Real-Time Cloud Synchronization Bridge
 * Connects mobile phone visitor submissions to front-desk reception terminals
 * instantly across all networks (4G/5G, local Wi-Fi, Vercel cloud deployments, multi-device).
 * Uses redundant cloud object relay + local backend direct push + window/storage events.
 */

import { Visitor } from '../types';
import { playCheckInChime, playOverdueAlertSound } from './audioChime';
import { saveIncomingVisitor } from '../api/mockEngine';

// Global Cloud Object Sync Relay Channel (Universal high-speed HTTPS channel)
const CLOUD_CHANNEL_ID = 'ff808181a09d98f701a0e84009f634f3';
const CLOUD_REST_URL = `https://api.restful-api.dev/objects/${CLOUD_CHANNEL_ID}`;

// Optional Secondary Relay (ntfy topic with abort timeout)
const NTFY_URL = 'https://ntfy.sh/bitnox_vms_live_reception_relay_v2';

export interface CloudEventPayload {
  type: 'NEW_VISITOR' | 'OVERSTAY_ALERT' | 'CHECK_OUT';
  visitor: Visitor;
  timestamp?: string;
  [key: string]: any;
}

type CloudEventListener = (payload: CloudEventPayload) => void;
const cloudEventListeners = new Set<CloudEventListener>();
const processedEventIds = new Set<string>();

/**
 * Broadcasts a new visitor check-in or alert to all connected reception screens worldwide
 */
export async function broadcastCloudEvent(payload: CloudEventPayload): Promise<void> {
  // 1. Dispatch locally in current window
  triggerLocalListeners(payload);

  // 2. Broadcast via localStorage for other tabs in same browser
  try {
    localStorage.setItem('bitnox_last_cloud_event', JSON.stringify({ ...payload, _ts: Date.now() }));
  } catch {}

  // 3. Direct backend push if API server is reachable
  try {
    fetch('/api/checkin-sessions/push-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor: payload.visitor }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch {}

  // 4. Universal Cloud Object Relay (accessible worldwide across 4G/5G mobile carriers)
  try {
    // Read current events from cloud channel, append new event, and write back
    const currentRes = await fetch(CLOUD_REST_URL, { signal: AbortSignal.timeout(3500) });
    let existingEvents: CloudEventPayload[] = [];
    if (currentRes.ok) {
      const currentObj = await currentRes.json();
      existingEvents = Array.isArray(currentObj.data?.events) ? currentObj.data.events : [];
    }

    const updatedEvents = [payload, ...existingEvents.filter((e) => e.visitor?.id !== payload.visitor?.id)].slice(0, 30);

    await fetch(CLOUD_REST_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'bitnox_channel_master',
        data: { events: updatedEvents, updated_at: Date.now() },
      }),
      signal: AbortSignal.timeout(3500),
    });
  } catch (err) {
    console.warn('[CloudSync] REST relay warning:', err);
  }

  // 5. Fallback relay (fire and forget with short timeout)
  try {
    fetch(NTFY_URL, {
      method: 'POST',
      headers: { 'Title': 'New Visitor Check-In', 'Priority': 'urgent' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});
  } catch {}
}

function triggerLocalListeners(payload: CloudEventPayload): void {
  if (!payload || !payload.visitor) return;
  const eventKey = `${payload.type}_${payload.visitor?.id || payload.visitor?.full_name}_${payload.timestamp || ''}`;
  if (processedEventIds.has(eventKey)) return;
  processedEventIds.add(eventKey);

  // Auto-persist new visitor into local store so all views have immediate access
  if (payload.type === 'NEW_VISITOR' && payload.visitor) {
    try {
      saveIncomingVisitor(payload.visitor);
      window.dispatchEvent(new CustomEvent('bitnox_new_visitor', { detail: { visitor: payload.visitor } }));
    } catch (e) {
      console.error('[CloudSync] Error saving incoming visitor:', e);
    }
  }

  // Keep set size reasonable
  if (processedEventIds.size > 200) {
    const arr = Array.from(processedEventIds);
    arr.slice(0, 100).forEach((id) => processedEventIds.delete(id));
  }

  cloudEventListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.error('[CloudSync] Error in event listener:', e);
    }
  });
}

/**
 * Subscribes the reception desk to live incoming visitor submissions from mobile phones
 */
export function subscribeCloudEvents(listener: CloudEventListener): () => void {
  cloudEventListeners.add(listener);

  // Return unsubscribe function
  return () => {
    cloudEventListeners.delete(listener);
  };
}

/**
 * Initializes real-time SSE stream & high-frequency polling from the universal cloud relay
 */
let isBridgeInitialized = false;

export function initCloudSyncBridge(): void {
  if (isBridgeInitialized || typeof window === 'undefined') return;
  isBridgeInitialized = true;

  // 1. High-frequency 2-second cloud sync poll (connects phones and reception desk seamlessly)
  const pollCloudHub = async () => {
    try {
      const res = await fetch(CLOUD_REST_URL, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      const obj = await res.json();
      const events: CloudEventPayload[] = Array.isArray(obj.data?.events) ? obj.data.events : [];

      for (const ev of events) {
        if (ev && (ev.type === 'NEW_VISITOR' || ev.type === 'OVERSTAY_ALERT')) {
          triggerLocalListeners(ev);
        }
      }
    } catch (e) {
      // Silently retry on next poll cycle
    }
  };

  // Initial poll & recurring interval
  pollCloudHub();
  const pollInterval = setInterval(pollCloudHub, 2000);

  // 2. Multi-tab storage synchronization
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'bitnox_last_cloud_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && (payload.type === 'NEW_VISITOR' || payload.type === 'OVERSTAY_ALERT')) {
          triggerLocalListeners(payload);
        }
      } catch {}
    }
  });
}

// Automatically start cloud bridge
initCloudSyncBridge();

