import { useCallback, useRef } from 'react';

// ============================================================
// PREMIUM SOUND EFFECTS — Persian-themed, warm, organic
// All synthesized with Web Audio API (no external files needed)
// ============================================================

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Create a warm plucked string sound (like santur/tar)
function pluckString(freq: number, time: number, vol = 0.08, decay = 0.4) {
  try {
    const ctx = getCtx();
    const t = time;

    // Main oscillator (triangle for warmth)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);

    // Harmonic overtone (subtle)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);

    // Bandpass filter for string-like character
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.8, t);
    filter.Q.setValueAtTime(3, t);

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    const gainH = ctx.createGain();
    gainH.gain.setValueAtTime(vol * 0.15, t);
    gainH.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.6);

    osc1.connect(filter);
    filter.connect(gain);
    osc2.connect(gainH);
    gainH.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + decay + 0.05);
    osc2.stop(t + decay + 0.05);
  } catch {}
}

// Soft percussive tap (like tombak finger tap)
function softTap(freq: number, time: number, vol = 0.06) {
  try {
    const ctx = getCtx();
    const t = time;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch {}
}

// Ney-like breathy tone (for special effects)
function neyBreath(freq: number, time: number, vol = 0.04, dur = 0.6) {
  try {
    const ctx = getCtx();
    const t = time;

    // Base sine
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    // Slight vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Breathiness via noise-like filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.08);
    gain.gain.setValueAtTime(vol, t + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  } catch {}
}

// Coin/reward shimmer
function shimmer(time: number, vol = 0.06) {
  try {
    const ctx = getCtx();
    const t = time;
    const freqs = [1047, 1319, 1568, 2093];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.04);
      g.gain.linearRampToValueAtTime(vol * (1 - i * 0.2), t + i * 0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.35);
    });
  } catch {}
}

export function useSound() {
  const sfxEnabled = useRef(true);

  const setEnabled = useCallback((v: boolean) => { sfxEnabled.current = v; }, []);

  // Letter select: warm santur-like pluck
  const playSelect = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    pluckString(698, ctx.currentTime, 0.06, 0.2);
  }, []);

  // Letter deselect: soft lower pluck
  const playDeselect = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    pluckString(440, ctx.currentTime, 0.04, 0.15);
  }, []);

  // Correct word: ascending santur arpeggio (Do-Mi-Sol-Do)
  const playCorrect = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      pluckString(f, t + i * 0.1, 0.07, 0.5);
    });
  }, []);

  // Wrong word: descending soft tombak thud
  const playWrong = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    softTap(250, t, 0.08);
    softTap(180, t + 0.1, 0.06);
  }, []);

  // Level complete: celebratory ascending scale with ney
  const playLevelComplete = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Santur arpeggio
    const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
    scale.forEach((f, i) => {
      pluckString(f, t + i * 0.09, 0.06, 0.5);
    });
    // Ney flourish on top
    neyBreath(1047, t + 0.5, 0.03, 0.8);
    // Final shimmer
    shimmer(t + 0.8, 0.04);
  }, []);

  // Combo: escalating santur chord
  const playCombo = useCallback((combo: number) => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    const base = 523 + combo * 60;
    pluckString(base, t, 0.07, 0.3);
    pluckString(base * 1.25, t + 0.06, 0.06, 0.3);
    pluckString(base * 1.5, t + 0.12, 0.07, 0.4);
  }, []);

  // Shuffle: cascading soft plucks
  const playShuffle = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    const freqs = [392, 440, 494, 523, 587];
    freqs.forEach((f, i) => {
      pluckString(f, t + i * 0.04, 0.035, 0.15);
    });
  }, []);

  // Hint: magical ney whisper + shimmer
  const playHint = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    const t = ctx.currentTime;
    neyBreath(880, t, 0.04, 0.4);
    shimmer(t + 0.15, 0.03);
  }, []);

  // Button tap: soft tombak tap
  const playButton = useCallback(() => {
    if (!sfxEnabled.current) return;
    const ctx = getCtx();
    softTap(500, ctx.currentTime, 0.04);
  }, []);

  return {
    playSelect, playDeselect, playCorrect, playWrong,
    playLevelComplete, playCombo, playShuffle, playHint, playButton,
    setEnabled, enabled: sfxEnabled
  };
}
