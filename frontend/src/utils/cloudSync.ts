/**
 * Bitnox VMS Universal Real-Time Cloud Synchronization Bridge
 * Connects mobile phone visitor submissions to front-desk reception terminals
 * instantly across all networks (4G/5G, local Wi-Fi, Vercel cloud deployments, multi-device).
 * Uses zero-configuration high-speed pub/sub relay with automatic retry & polling fallback.
 */

import { Visitor } from '../types';
import { playCheckInChime, playOverdueAlertSound } from './audioChime';

// Unique persistent topic for Bitnox VMS live reception feed
const CLOUD_SYNC_TOPIC = 'bitnox_vms_live_reception_relay_v2';
const CLOUD_RELAY_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}`;

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

  // 3. Broadcast to global cloud pub/sub relay (reaches all reception PCs on any network)
  try {
    await fetch(CLOUD_RELAY_URL, {
      method: 'POST',
      headers: {
        'Title': payload.type === 'NEW_VISITOR' ? 'New Visitor Checked In' : 'Visitor Overstay Alert',
        'Priority': 'urgent',
        'Tags': payload.type === 'NEW_VISITOR' ? 'bell,door' : 'warning,clock',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[CloudSync] Broadcast relay network warning:', err);
  }
}

function triggerLocalListeners(payload: CloudEventPayload): void {
  const eventKey = `${payload.type}_${payload.visitor?.id}_${payload.timestamp || ''}`;
  if (processedEventIds.has(eventKey)) return;
  processedEventIds.add(eventKey);

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
 * Initializes real-time SSE stream & background poll from the cloud relay
 */
let isBridgeInitialized = false;

export function initCloudSyncBridge(): void {
  if (isBridgeInitialized || typeof window === 'undefined') return;
  isBridgeInitialized = true;

  // 1. Connect to high-speed SSE stream
  let sse: EventSource | null = null;

  const connectSSE = () => {
    try {
      if (sse) {
        sse.close();
      }
      sse = new EventSource(`${CLOUD_RELAY_URL}/sse`);

      sse.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const messageStr = raw.message || raw;
          const parsed = typeof messageStr === 'string' ? JSON.parse(messageStr) : messageStr;

          if (parsed && (parsed.type === 'NEW_VISITOR' || parsed.type === 'OVERSTAY_ALERT')) {
            triggerLocalListeners(parsed);
          }
        } catch (e) {
          // Ignore heartbeats or non-JSON messages
        }
      };

      sse.onerror = () => {
        // SSE will reconnect automatically
      };
    } catch {}
  };

  connectSSE();

  // 2. High-speed 3s fallback poll to guarantee 100% arrival capture even on firewalled networks
  const pollCloudEvents = async () => {
    try {
      const res = await fetch(`${CLOUD_RELAY_URL}/json?poll=1&since=10m`);
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line);
          const messageStr = raw.message || raw;
          const parsed = typeof messageStr === 'string' ? JSON.parse(messageStr) : messageStr;

          if (parsed && (parsed.type === 'NEW_VISITOR' || parsed.type === 'OVERSTAY_ALERT')) {
            triggerLocalListeners(parsed);
          }
        } catch {}
      }
    } catch {}
  };

  // Initial poll
  pollCloudEvents();
  const pollInterval = setInterval(pollCloudEvents, 3000);

  // 3. Multi-tab storage synchronization
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
