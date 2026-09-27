/**
 * Bitnox VMS Audio Synthesis Engine
 * Synthesizes crisp, pleasant front-desk chimes and overdue visitor alert sounds
 * using the Web Audio API with auto-unlocking and fallback support.
 * Zero external audio files required. Works across all modern browsers.
 */

let audioCtx: AudioContext | null = null;
const AUDIO_STORAGE_KEY = 'bitnox_audio_enabled';

// Initialize audio context state from localStorage (default: enabled)
let isAudioActive: boolean = (() => {
  const stored = localStorage.getItem(AUDIO_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
})();

// Listeners for UI state changes (e.g. Navbar speaker icon sync)
type AudioStateListener = (enabled: boolean) => void;
const audioStateListeners = new Set<AudioStateListener>();

export function isAudioEnabled(): boolean {
  return isAudioActive;
}

export function setAudioEnabled(enabled: boolean): void {
  isAudioActive = enabled;
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, String(enabled));
  } catch {}
  audioStateListeners.forEach((fn) => {
    try {
      fn(enabled);
    } catch {}
  });
}

export function toggleAudio(): boolean {
  const next = !isAudioActive;
  setAudioEnabled(next);
  if (next) {
    playCheckInChime(true);
  }
  return next;
}

export function subscribeAudioState(listener: AudioStateListener): () => void {
  audioStateListeners.add(listener);
  return () => {
    audioStateListeners.delete(listener);
  };
}

/**
 * Initializes and unlocks the Web Audio Context.
 * Browsers require a user interaction (click/touch/keydown) to resume audio context.
 */
export function getOrCreateAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch (err) {
    console.warn('[AudioChime] Unable to initialize AudioContext:', err);
    return null;
  }
}

/**
 * Eagerly unlock audio on user gesture anywhere on page
 */
export function initAudioAutoUnlock(): void {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const ctx = getOrCreateAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
  };

  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((event) => {
    window.addEventListener(event, unlock, { capture: true, passive: true });
  });
}

// Auto-run unlock listener on module load
initAudioAutoUnlock();

// Deduplicate rapid consecutive chimes within 350ms
let lastCheckInChimeTime = 0;
let lastOverdueAlertTime = 0;

/**
 * Synthesizes a high-fidelity 3-tone front desk reception chime:
 * A5 (880 Hz) -> C#6 (1108.7 Hz) -> E6 (1318.5 Hz) with sparkling acoustic decay.
 */
export function playCheckInChime(force: boolean = false): void {
  if (!isAudioActive && !force) return;

  const nowMs = Date.now();
  if (nowMs - lastCheckInChimeTime < 350 && !force) return;
  lastCheckInChimeTime = nowMs;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) {
      fallbackBeep(880, 0.4);
      return;
    }

    // If context was suspended, resume it first
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => scheduleCheckInChimeNodes(ctx)).catch(() => {
        fallbackBeep(880, 0.4);
      });
    } else {
      scheduleCheckInChimeNodes(ctx);
    }
  } catch (error) {
    console.warn('[AudioChime] Error playing check-in chime:', error);
  }
}

function scheduleCheckInChimeNodes(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Tone 1: A5 (880 Hz) - Bright intro bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2: C#6 (1108.7 Hz) - Harmonizing middle tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.7, now + 0.09);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.09);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.105);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.85);

    // Tone 3: E6 (1318.5 Hz) - Sparkling high reception chime ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.5, now + 0.18);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.001, now + 0.18);
    gain3.gain.linearRampToValueAtTime(0.35, now + 0.195);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.18);
    osc3.stop(now + 1.25);

    // Subtle warm overtone for richness (triangle oscillator)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(440, now + 0.18); // A4
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.setValueAtTime(0.001, now + 0.18);
    subGain.gain.linearRampToValueAtTime(0.08, now + 0.195);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now + 0.18);
    subOsc.stop(now + 0.9);
  } catch (err) {
    console.warn('[AudioChime] Error scheduling chime nodes:', err);
  }
}

/**
 * Synthesizes a distinctive, urgent 2-pulse attention alert for overdue visitors:
 * Pulse 1 (587 Hz - D5) -> Pulse 2 (880 Hz - A5) with noticeable pulse warning cadence.
 */
export function playOverdueAlertSound(force: boolean = false): void {
  if (!isAudioActive && !force) return;

  const nowMs = Date.now();
  if (nowMs - lastOverdueAlertTime < 500 && !force) return;
  lastOverdueAlertTime = nowMs;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) {
      fallbackBeep(587, 0.5);
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => scheduleOverdueAlertNodes(ctx)).catch(() => {
        fallbackBeep(587, 0.5);
      });
    } else {
      scheduleOverdueAlertNodes(ctx);
    }
  } catch (error) {
    console.warn('[AudioChime] Error playing overdue alert sound:', error);
  }
}

function scheduleOverdueAlertNodes(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Pulse 1: Warning buzz D5 (587.3 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.3, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Pulse 2: Alert chime A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.25);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.27);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.75);

    // Pulse 3: High confirmation warning F6 (1396.9 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1396.9, now + 0.48);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.001, now + 0.48);
    gain3.gain.linearRampToValueAtTime(0.32, now + 0.5);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.48);
    osc3.stop(now + 1.1);
  } catch (err) {
    console.warn('[AudioChime] Error scheduling overdue alert nodes:', err);
  }
}

/**
 * Fallback audio generator if Web Audio oscillator graph encounters an issue
 */
function fallbackBeep(freq: number = 880, duration: number = 0.3): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}
