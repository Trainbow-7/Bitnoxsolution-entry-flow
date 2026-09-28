import { Visitor } from '../types';
import { saveIncomingVisitor } from '../api/mockEngine';

export interface CloudEventPayload {
  type: 'NEW_VISITOR' | 'OVERSTAY_ALERT' | 'CHECK_OUT';
  visitor: Visitor;
  timestamp?: string;
  [key: string]: any;
}

type CloudEventListener = (payload: CloudEventPayload) => void;
const cloudEventListeners = new Set<CloudEventListener>();
const processedEventIds = new Set<string>();

// High-speed browser BroadcastChannel for zero-latency inter-tab communication
const syncBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('bitnox_vms_sync_channel')
  : null;

if (syncBroadcastChannel) {
  syncBroadcastChannel.onmessage = (event) => {
    try {
      const payload = event.data;
      if (payload && payload.visitor) {
        triggerLocalListeners(payload);
      }
    } catch {}
  };
}

/**
 * Broadcasts a new visitor check-in or alert to all connected reception screens
 */
export async function broadcastCloudEvent(payload: CloudEventPayload): Promise<void> {
  if (!payload || !payload.visitor) return;

  // 1. Dispatch locally in current window
  triggerLocalListeners(payload);

  // 2. Broadcast via BroadcastChannel to all other windows/tabs immediately
  try {
    syncBroadcastChannel?.postMessage(payload);
  } catch {}

  // 3. Broadcast via localStorage for other tabs in same browser
  try {
    localStorage.setItem('bitnox_last_cloud_event', JSON.stringify({ ...payload, _ts: Date.now() }));
    localStorage.setItem('bitnox_last_visitor', JSON.stringify(payload.visitor));
  } catch {}

  // 4. Direct backend push to persist in SQLite and trigger server SSE broadcast
  try {
    await fetch('/api/checkin-sessions/push-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor: payload.visitor }),
      signal: AbortSignal.timeout(3500),
    });
  } catch {}
}

export function triggerLocalListeners(payload: CloudEventPayload): void {
  if (!payload || !payload.visitor) return;
  const eventKey = `${payload.type}_${payload.visitor?.id || payload.visitor?.full_name}_${payload.timestamp || payload.visitor?.arrival_datetime || ''}`;
  if (processedEventIds.has(eventKey)) return;
  processedEventIds.add(eventKey);

  // Auto-persist new visitor into local store so all views have immediate access
  if (payload.type === 'NEW_VISITOR' && payload.visitor) {
    try {
      saveIncomingVisitor(payload.visitor);
      window.dispatchEvent(new CustomEvent('bitnox_new_visitor', { detail: { visitor: payload.visitor } }));

      // Also ensure backend SQLite has the record
      fetch('/api/checkin-sessions/push-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor: payload.visitor }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
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
 * Initializes real-time synchronization listeners
 */
let isBridgeInitialized = false;

export function initCloudSyncBridge(): void {
  if (isBridgeInitialized || typeof window === 'undefined') return;
  isBridgeInitialized = true;

  // Multi-tab storage synchronization
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'bitnox_last_cloud_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && (payload.type === 'NEW_VISITOR' || payload.type === 'OVERSTAY_ALERT')) {
          triggerLocalListeners(payload);
        }
      } catch {}
    } else if (e.key === 'bitnox_last_visitor' && e.newValue) {
      try {
        const vis = JSON.parse(e.newValue);
        if (vis && vis.id) {
          triggerLocalListeners({ type: 'NEW_VISITOR', visitor: vis });
        }
      } catch {}
    }
  });
}

// Automatically start cloud bridge
initCloudSyncBridge();

