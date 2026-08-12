import { useRef, useCallback, useState, useEffect } from 'react';

// ============================================================
// PERSIAN AMBIENT MUSIC SYSTEM
// Authentic Shur/Segah dastgah-inspired generative music
// Instruments: Santur (hammered dulcimer), Ney (reed flute), Tar drone
// Style: Calm, meditative, non-intrusive, warm
// ============================================================

// Persian Shur scale (D Eb F G A Bb C D) — the most common dastgah
const SHUR = [293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33];
// Segah scale for variation (Eb F G Ab Bb C D Eb)  
const SEGAH = [311.13, 349.23, 392.00, 415.30, 466.16, 523.25, 587.33, 622.25];

const DRONE_D = 146.83; // D2 drone (tar/tanpura)
const DRONE_A = 110.00; // A2 drone

let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Santur pluck — warm hammered dulcimer sound
function santurNote(freq: number, time: number, vol = 0.03) {
  try {
    const c = getCtx();
    // Main tone
    const osc1 = c.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    // Slight natural detuning
    osc1.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, time);

    // Harmonic at 2x (characteristic of hammered strings)
    const osc2 = c.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.01, time);

    // Subtle 3rd harmonic
    const osc3 = c.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3.02, time);

    // Bandpass for resonance
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq * 1.5, time);
    bp.Q.setValueAtTime(2, time);

    // Envelope — quick attack, gentle decay (like struck string)
    const decay = 1.2 + Math.random() * 0.8;
    const g1 = c.createGain();
    g1.gain.setValueAtTime(0, time);
    g1.gain.linearRampToValueAtTime(vol, time + 0.005);
    g1.gain.exponentialRampToValueAtTime(vol * 0.3, time + 0.15);
    g1.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    const g2 = c.createGain();
    g2.gain.setValueAtTime(vol * 0.12, time);
    g2.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.5);

    const g3 = c.createGain();
    g3.gain.setValueAtTime(vol * 0.05, time);
    g3.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.3);

    // Reverb simulation via delay
    const delay = c.createDelay();
    delay.delayTime.value = 0.12;
    const delayGain = c.createGain();
    delayGain.gain.value = 0.15;

    osc1.connect(bp); bp.connect(g1);
    osc2.connect(g2); g2.connect(g1);
    osc3.connect(g3); g3.connect(g1);
    g1.connect(c.destination);
    g1.connect(delay); delay.connect(delayGain); delayGain.connect(c.destination);

    osc1.start(time); osc2.start(time); osc3.start(time);
    osc1.stop(time + decay + 0.2);
    osc2.stop(time + decay + 0.2);
    osc3.stop(time + decay + 0.2);
  } catch {}
}

// Ney (reed flute) — breathy, soulful
function neyNote(freq: number, time: number, vol = 0.02, dur = 2) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Vibrato (characteristic of ney)
    const vib = c.createOscillator();
    vib.frequency.value = 4.5 + Math.random();
    const vibG = c.createGain();
    vibG.gain.value = freq * 0.006;
    vib.connect(vibG); vibG.connect(osc.frequency);

    // Breathy overlay (noise-filtered)
    const osc2 = c.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.001;
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = freq * 0.8;
    hpf.Q.value = 1;
    const breathG = c.createGain();
    breathG.gain.setValueAtTime(vol * 0.08, time);
    breathG.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    // Smooth envelope — slow attack, sustain, fade
    const g = c.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.3);
    g.gain.setValueAtTime(vol * 0.85, time + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(g); g.connect(c.destination);
    osc2.connect(hpf); hpf.connect(breathG); breathG.connect(c.destination);

    osc.start(time); vib.start(time); osc2.start(time);
    osc.stop(time + dur + 0.1);
    vib.stop(time + dur + 0.1);
    osc2.stop(time + dur + 0.1);
  } catch {}
}

// Tar drone — continuous low hum (tanpura-like)
function startDrone(time: number, vol = 0.015, dur = 8) {
  try {
    const c = getCtx();
    // Root drone
    const d1 = c.createOscillator();
    d1.type = 'sine';
    d1.frequency.value = DRONE_D;
    // Fifth drone
    const d2 = c.createOscillator();
    d2.type = 'sine';
    d2.frequency.value = DRONE_A;

    const g1 = c.createGain();
    g1.gain.setValueAtTime(0, time);
    g1.gain.linearRampToValueAtTime(vol, time + 1.5);
    g1.gain.setValueAtTime(vol, time + dur - 2);
    g1.gain.linearRampToValueAtTime(0, time + dur);

    const g2 = c.createGain();
    g2.gain.setValueAtTime(0, time);
    g2.gain.linearRampToValueAtTime(vol * 0.6, time + 2);
    g2.gain.setValueAtTime(vol * 0.6, time + dur - 2);
    g2.gain.linearRampToValueAtTime(0, time + dur);

    d1.connect(g1); g1.connect(c.destination);
    d2.connect(g2); g2.connect(c.destination);

    d1.start(time); d2.start(time);
    d1.stop(time + dur + 0.1);
    d2.stop(time + dur + 0.1);
  } catch {}
}

// ============================================================
// COMPOSITION ENGINE — generative Persian ambient
// ============================================================

// Pre-composed melodic phrases (common Shur motifs)
const PHRASES = [
  [0, 1, 2, 3, 2, 1, 0],       // ascending-descending
  [3, 4, 5, 4, 3, 2],          // middle register phrase
  [0, 2, 3, 5, 3, 2, 0],       // leap and return
  [4, 5, 6, 5, 4, 3, 4],       // upper register
  [0, 0, 1, 2, 1, 0],          // meditation on root
  [2, 3, 4, 3, 2, 1, 2],       // gentle wave
  [5, 4, 3, 2, 3, 4, 3, 2, 1], // long descending
  [0, 3, 2, 4, 3, 5, 4, 3],    // stepwise with leaps
];

export function useMusic() {
  const [playing, setPlaying] = useState(false);
  const mainLoop = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isPlaying = useRef(false);

  // Load preference from localStorage
  useEffect(() => {
    const pref = localStorage.getItem('abumirza_music');
    if (pref === 'off') setPlaying(false);
  }, []);

  const schedulePhrase = useCallback(() => {
    if (!isPlaying.current) return;

    try {
      const c = getCtx();
      const now = c.currentTime;

      // Pick a random scale (mostly Shur, sometimes Segah)
      const scale = Math.random() > 0.8 ? SEGAH : SHUR;

      // Pick a random phrase
      const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];

      // Timing: slow, meditative (600-900ms per note)
      const noteGap = 0.6 + Math.random() * 0.35;

      // Play santur melody
      phrase.forEach((idx, i) => {
        const freq = scale[Math.min(idx, scale.length - 1)];
        const t = now + i * noteGap + Math.random() * 0.05;
        santurNote(freq, t, 0.025 + Math.random() * 0.01);

        // Occasional octave double (santur characteristic)
        if (Math.random() > 0.75) {
          santurNote(freq * 2, t + 0.01, 0.012);
        }
      });

      // Ney joins occasionally (every 2-3 phrases)
      if (Math.random() > 0.55) {
        const neyIdx = phrase[Math.floor(phrase.length / 2)];
        const neyFreq = scale[Math.min(neyIdx, scale.length - 1)] * 2; // upper octave
        neyNote(neyFreq, now + phrase.length * noteGap * 0.3, 0.015, 1.8 + Math.random());
      }

      // Drone refresh every other phrase
      if (Math.random() > 0.4) {
        startDrone(now, 0.012, phrase.length * noteGap + 3);
      }

      // Schedule next phrase
      const phraseDuration = phrase.length * noteGap;
      const restBetween = 1.5 + Math.random() * 2.5; // pause between phrases
      const nextDelay = (phraseDuration + restBetween) * 1000;

      mainLoop.current = setTimeout(schedulePhrase, nextDelay);
    } catch {
      mainLoop.current = setTimeout(schedulePhrase, 3000);
    }
  }, []);

  const start = useCallback(() => {
    isPlaying.current = true;
    setPlaying(true);
    localStorage.setItem('abumirza_music', 'on');

    // Start with a gentle drone
    try {
      const c = getCtx();
      startDrone(c.currentTime, 0.015, 6);
    } catch {}

    // Begin scheduling phrases after a short intro drone
    mainLoop.current = setTimeout(schedulePhrase, 1500);
  }, [schedulePhrase]);

  const stop = useCallback(() => {
    isPlaying.current = false;
    setPlaying(false);
    localStorage.setItem('abumirza_music', 'off');
    if (mainLoop.current) {
      clearTimeout(mainLoop.current);
      mainLoop.current = undefined;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying.current) stop(); else start();
  }, [start, stop]);

  return { playing, start, stop, toggle };
}
