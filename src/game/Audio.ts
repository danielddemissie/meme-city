import { MEME_PACK_SLOTS, type MemePackSlot } from '../theme';

type CueName = 'knock' | 'squeak' | 'engine' | 'taps' | 'whistle' | 'tick' | 'spotted' | 'blink' | 'win' | 'fail';

interface PackStatus {
  loaded: Partial<Record<MemePackSlot, AudioBuffer>>;
  decoder: AudioContext | null;
}

const pack: PackStatus = { loaded: {}, decoder: null };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function beep(time: number, freq: number, dur: number, type: OscillatorType, gain: number): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(gain, time + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(env).connect(master);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function noise(time: number, dur: number, gain: number, lowpass: number): void {
  if (!ctx || !master) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(master);
  src.start(time);
}

function synthCue(cue: Exclude<CueName, 'win' | 'fail' | 'spotted' | 'blink'>, pattern: readonly number[]): void {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + 0.05;
  for (const offset of pattern) {
    const t = t0 + offset;
    switch (cue) {
      case 'knock':
        beep(t, 148, 0.16, 'triangle', 0.5);
        beep(t + 0.008, 92, 0.22, 'sine', 0.45);
        break;
      case 'squeak':
        beep(t, 660 + Math.random() * 120, 0.14, 'square', 0.12);
        beep(t + 0.06, 900 + Math.random() * 100, 0.1, 'square', 0.08);
        break;
      case 'engine':
        beep(t, 62, 0.7, 'sawtooth', 0.16);
        beep(t, 94, 0.7, 'sawtooth', 0.1);
        break;
      case 'taps':
        beep(t, 420, 0.09, 'square', 0.14);
        noise(t, 0.05, 0.1, 5200);
        break;
      case 'whistle':
        beep(t, 1e3 + Math.random() * 240, 0.26, 'sine', 0.1);
        beep(t + 0.3, 1240, 0.2, 'sine', 0.07);
        break;
      case 'tick':
        beep(t, 2100, 0.03, 'square', 0.05);
        break;
    }
  }
}

export const Audio = {
  unlock(): void {
    ensure();
  },
  packDecoder(): AudioContext | null {
    return ensure();
  },
  memorize(slot: MemePackSlot, buffer: AudioBuffer): void {
    pack.loaded[slot] = buffer;
    pack.decoder = ctx;
  },
  packFor(slot: MemePackSlot): AudioBuffer | undefined {
    return pack.loaded[slot];
  },
  async decode(slot: MemePackSlot, data: ArrayBuffer): Promise<AudioBuffer | null> {
    try {
      const c = ensure();
      if (!c) return null;
      const decoded = await c.decodeAudioData(data);
      Audio.memorize(slot, decoded);
      return decoded;
    } catch {
      return null;
    }
  },
  async probePack(slot: MemePackSlot, url: string): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'force-cache' });
      if (!res.ok) return null;
      return await Audio.decode(slot, await res.arrayBuffer());
    } catch {
      return null;
    }
  },
  elapse(cue: CueName, pattern: readonly number[] = [0]): void {
    const c = ensure();
    if (!c) return;
    if (cue === 'knock' || cue === 'squeak' || cue === 'engine' || cue === 'taps' || cue === 'whistle' || cue === 'tick') {
      synthCue(cue, pattern);
      return;
    }
    if (cue === 'spotted') {
      beep(c.currentTime + 0.05, 420, 0.18, 'triangle', 0.22);
      beep(c.currentTime + 0.13, 560, 0.16, 'triangle', 0.16);
      return;
    }
    if (cue === 'blink') {
      if (Audio.packFor('blink')) return;
      beep(c.currentTime + 0.04, 320, 0.22, 'sawtooth', 0.2);
      beep(c.currentTime + 0.12, 180, 0.3, 'sawtooth', 0.14);
      return;
    }
    if (cue === 'win') {
      beep(c.currentTime + 0.05, 540, 0.4, 'triangle', 0.3);
      beep(c.currentTime + 0.22, 680, 0.44, 'triangle', 0.26);
      beep(c.currentTime + 0.4, 900, 0.6, 'triangle', 0.22);
      return;
    }
    if (cue === 'fail') {
      beep(c.currentTime + 0.05, 120, 0.7, 'sawtooth', 0.32);
      beep(c.currentTime + 0.2, 78, 0.9, 'sine', 0.3);
      noise(c.currentTime + 0.05, 0.4, 0.14, 320);
    }
  },
  playPack(buffer: AudioBuffer, volume = 0.8): void {
    const c = ensure();
    if (!c || !master) return;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const env = c.createGain();
    env.gain.value = volume;
    src.connect(env).connect(master);
    src.start();
  },
  packSlots(): readonly MemePackSlot[] {
    return MEME_PACK_SLOTS;
  },
};
