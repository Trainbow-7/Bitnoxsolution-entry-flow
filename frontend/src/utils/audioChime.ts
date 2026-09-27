/**
 * Bitnox VMS Audio Synthesis Engine
 * Synthesizes crisp, pleasant front-desk chimes and overdue visitor alert sounds
 * using the Web Audio API with auto-unlocking, HTML5 audio fallback, and volume boost.
 * Zero external audio files required. Works across all modern browsers.
 */

let audioCtx: AudioContext | null = null;
const AUDIO_STORAGE_KEY = 'bitnox_audio_enabled';

// Initialize audio context state from localStorage (default: enabled)
let isAudioActive: boolean = (() => {
  try {
    const stored = localStorage.getItem(AUDIO_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
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
 * Eagerly unlock audio on any user interaction anywhere on the screen
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

  ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart', 'focus'].forEach((event) => {
    window.addEventListener(event, unlock, { capture: true, passive: true });
  });
}

// Auto-run unlock listener on module load
initAudioAutoUnlock();

// Deduplicate rapid consecutive chimes within 300ms
let lastCheckInChimeTime = 0;
let lastOverdueAlertTime = 0;

/**
 * Synthesizes a high-fidelity 3-tone front desk reception chime:
 * A5 (880 Hz) -> C#6 (1108.7 Hz) -> E6 (1318.5 Hz) with sparkling acoustic decay.
 */
export function playCheckInChime(force: boolean = false): void {
  if (!isAudioActive && !force) return;

  const nowMs = Date.now();
  if (nowMs - lastCheckInChimeTime < 300 && !force) return;
  lastCheckInChimeTime = nowMs;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) {
      playDataUriChime();
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        scheduleCheckInChimeNodes(ctx);
      }).catch(() => {
        playDataUriChime();
      });
    } else {
      scheduleCheckInChimeNodes(ctx);
    }
  } catch (error) {
    console.warn('[AudioChime] Error playing check-in chime:', error);
    playDataUriChime();
  }
}

function scheduleCheckInChimeNodes(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Master volume booster gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Tone 1: A5 (880 Hz) - Bright bell intro
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.65);

    // Tone 2: C#6 (1108.7 Hz) - Harmonizing middle tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.7, now + 0.09);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.09);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.105);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.9);

    // Tone 3: E6 (1318.5 Hz) - Sparkling reception chime ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.5, now + 0.18);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.001, now + 0.18);
    gain3.gain.linearRampToValueAtTime(0.55, now + 0.195);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now + 0.18);
    osc3.stop(now + 1.35);

    // Subtle warm overtone (triangle oscillator)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(440, now + 0.18); // A4
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.setValueAtTime(0.001, now + 0.18);
    subGain.gain.linearRampToValueAtTime(0.15, now + 0.195);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now + 0.18);
    subOsc.stop(now + 0.95);
  } catch (err) {
    console.warn('[AudioChime] Error scheduling chime nodes:', err);
  }
}

/**
 * Synthesizes a distinctive, urgent alert sound for overdue visitors:
 * Pulse 1 (587.3 Hz - D5) -> Pulse 2 (880 Hz - A5) -> Pulse 3 (1396.9 Hz - F6)
 */
export function playOverdueAlertSound(force: boolean = false): void {
  if (!isAudioActive && !force) return;

  const nowMs = Date.now();
  if (nowMs - lastOverdueAlertTime < 500 && !force) return;
  lastOverdueAlertTime = nowMs;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) {
      playDataUriAlert();
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        scheduleOverdueAlertNodes(ctx);
      }).catch(() => {
        playDataUriAlert();
      });
    } else {
      scheduleOverdueAlertNodes(ctx);
    }
  } catch (error) {
    console.warn('[AudioChime] Error playing overdue alert sound:', error);
    playDataUriAlert();
  }
}

function scheduleOverdueAlertNodes(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Pulse 1: Warning pulse D5 (587.3 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(587.3, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.24);

    // Pulse 2: Alert chime A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.26);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.26);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.28);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.26);
    osc2.stop(now + 0.8);

    // Pulse 3: High confirmation warning F6 (1396.9 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1396.9, now + 0.5);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.001, now + 0.5);
    gain3.gain.linearRampToValueAtTime(0.55, now + 0.52);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now + 0.5);
    osc3.stop(now + 1.2);
  } catch (err) {
    console.warn('[AudioChime] Error scheduling overdue alert nodes:', err);
  }
}

/**
 * Fallback synthesizer that generates a tiny WAV buffer in memory and plays via HTMLAudioElement
 */
function playDataUriChime(): void {
  try {
    const audio = createSineWavAudio(880, 0.5);
    audio.play().catch(() => {});
  } catch {}
}

function playDataUriAlert(): void {
  try {
    const audio = createSineWavAudio(587, 0.6);
    audio.play().catch(() => {});
  } catch {}
}

function createSineWavAudio(frequency: number, duration: number): HTMLAudioElement {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF identifier
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // Subchunk1 ("fmt ")
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
  buffer.set([16, 0, 0, 0], 16); // Subchunk1Size (16 for PCM)
  buffer.set([1, 0], 20); // AudioFormat (1 for PCM)
  buffer.set([1, 0], 22); // NumChannels (1 = Mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff; // ByteRate
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer.set([1, 0], 32); // BlockAlign
  buffer.set([8, 0], 34); // BitsPerSample (8-bit)

  // Subchunk2 ("data")
  buffer.set([0x64, 0x61, 0x74, 0x61], 36);
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Generate simple sine wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = 1 - (i / numSamples); // Linear decay
    const val = Math.sin(2 * Math.PI * frequency * t) * env;
    buffer[44 + i] = Math.floor(128 + val * 120);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = btoa(binary);
  return new Audio(`data:audio/wav;base64,${base64}`);
}
