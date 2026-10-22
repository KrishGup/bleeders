/**
 * Tiny WebAudio synthesiser — no audio files to download. Every sound is a
 * handful of oscillators with short envelopes, so they're light and crisp.
 */
type Wave = OscillatorType;

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (value) context();
}

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, wave: Wave, gain = 0.08, glideTo?: number) {
  const audio = context();
  if (!audio) return;
  const t0 = audio.currentTime + start;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(start: number, duration: number, gain = 0.05) {
  const audio = context();
  if (!audio) return;
  const length = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const amp = audio.createGain();
  filter.type = 'highpass';
  filter.frequency.value = 2400;
  amp.gain.value = gain;
  source.buffer = buffer;
  source.connect(filter).connect(amp).connect(audio.destination);
  source.start(audio.currentTime + start);
}

export const sfx = {
  /** A tile flipping over. */
  flip(index = 0) {
    if (!enabled) return;
    tone(520 + index * 40, 0, 0.07, 'triangle', 0.035);
  },
  /** A guess that isn't the answer. */
  miss() {
    if (!enabled) return;
    tone(196, 0, 0.18, 'sine', 0.06, 130);
  },
  /** A reveal of a new clue. */
  clue() {
    if (!enabled) return;
    tone(660, 0, 0.12, 'sine', 0.04);
    tone(990, 0.06, 0.16, 'sine', 0.03);
  },
  /** Sword-draw swish + rising chord: the soul is found. */
  win() {
    if (!enabled) return;
    noise(0, 0.22, 0.05);
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.08 + i * 0.07, 0.6, 'triangle', 0.05));
    tone(1568, 0.5, 0.9, 'sine', 0.025);
  },
  lose() {
    if (!enabled) return;
    [330, 262, 196].forEach((f, i) => tone(f, i * 0.12, 0.35, 'sine', 0.05));
  },
  unlock() {
    if (!enabled) return;
    [880, 1174.66, 1760].forEach((f, i) => tone(f, i * 0.06, 0.25, 'square', 0.02));
  },
  tap() {
    if (!enabled) return;
    tone(880, 0, 0.04, 'square', 0.015);
  },
};
