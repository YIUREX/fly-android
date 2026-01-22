
import { Vector, Mission, Rarity, LootResult } from './types';
import { PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS } from './constants';

export const vecAdd = (v1: Vector, v2: Vector): Vector => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const vecSub = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const vecMult = (v: Vector, n: number): Vector => ({ x: v.x * n, y: v.y * n });
export const vecLen = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const vecNorm = (v: Vector): Vector => {
  const len = vecLen(v);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
};
export const dist = (v1: Vector, v2: Vector): number => vecLen(vecSub(v1, v2));

export const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

export const lerpColor = (a: string, b: string, amount: number) => { 
    const ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + ((rr | 0) << 16) + ((rg | 0) << 8) + (rb | 0)).toString(16).slice(1);
}

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const rectIntersect = (r1: any, r2: any) => {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom || 
             r2.bottom < r1.top);
};

// --- LOOT BOX SYSTEM ---
export const getRarityColor = (rarity: Rarity) => {
    switch(rarity) {
        case Rarity.COMMON: return '#94a3b8'; // Slate 400
        case Rarity.RARE: return '#3b82f6'; // Blue 500
        case Rarity.EPIC: return '#a855f7'; // Purple 500
        case Rarity.LEGENDARY: return '#eab308'; // Yellow 500
        default: return '#ffffff';
    }
};

export const getLootItem = (): { item: any, type: 'model' | 'skin' | 'trail' | 'effect' } => {
    const roll = Math.random();
    let rarity = Rarity.COMMON;
    
    // ADJUSTED TO BE MORE RESTRICTIVE
    if (roll < 0.02) rarity = Rarity.LEGENDARY; // 2%
    else if (roll < 0.07) rarity = Rarity.EPIC; // 5%
    else if (roll < 0.25) rarity = Rarity.RARE; // 18%
    else rarity = Rarity.COMMON; // 75%

    // Filter items by rarity from all pools
    const pool = [
        ...PLANE_MODELS.filter(i => i.rarity === rarity).map(i => ({...i, _type: 'model' as const})),
        ...PLANE_SKINS.filter(i => i.rarity === rarity).map(i => ({...i, _type: 'skin' as const})),
        ...TRAILS.filter(i => i.rarity === rarity).map(i => ({...i, _type: 'trail' as const})),
        ...DEATH_EFFECTS.filter(i => i.rarity === rarity).map(i => ({...i, _type: 'effect' as const}))
    ];

    if (pool.length === 0) {
        // Fallback if rarity pool is empty
        return { item: PLANE_SKINS[0], type: 'skin' };
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    const type = selected._type;
    // Remove temporary _type property before returning item
    const { _type, ...item } = selected;
    return { item, type };
};

// --- MISSION GENERATOR ---
export const generateDailyMissions = (): Mission[] => {
  const missions: Mission[] = [
    { id: 1, description: 'Recoge 50 monedas', target: 50, current: 0, completed: false, reward: 25, type: 'coins' },
    { id: 2, description: 'Llega a 1000 puntos', target: 1000, current: 0, completed: false, reward: 50, type: 'score' },
    { id: 3, description: 'Sobrevive 60 segundos', target: 60, current: 0, completed: false, reward: 35, type: 'time' }
  ];
  return missions;
};

// --- SOUND MANAGER ---
class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  rainNode: AudioBufferSourceNode | null = null;
  rainGain: GainNode | null = null;
  rainStopTimeout: any = null;
  currentVolume: number = 0.3; // Default volume

  setVolume(volume: number) {
      this.currentVolume = volume;
      if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(volume, this.ctx?.currentTime || 0);
      }
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.currentVolume; // Use stored volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createOscillator(type: OscillatorType, freq: number, duration: number, volume: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // --- SYNTHESIZED SOUND EFFECTS ---

  playCoin() {
    this.init();
    if (!this.ctx) return;
    // High pitch "ding"
    this.createOscillator('sine', 1200, 0.1, 0.5);
    setTimeout(() => this.createOscillator('sine', 1600, 0.2, 0.3), 50);
  }

  playExplosion() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  playPowerUp() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playGameOver() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    // Sad descend
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }

  playShockwave() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // --- RAIN & THUNDER (Synthesized) ---

  startRain() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.rainNode) {
        // Already playing, cancel any stop request
        if (this.rainStopTimeout) {
            clearTimeout(this.rainStopTimeout);
            this.rainStopTimeout = null;
            // Fade back in
            this.rainGain?.gain.cancelScheduledValues(this.ctx.currentTime);
            this.rainGain?.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 1.0);
        }
        return; 
    }

    // Pink Noise Generator for Rain
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }

    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 2.0); // Fade in to 0.8

    // Lowpass filter to muffle the noise into "rain"
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 800;

    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    
    this.rainNode.start();
  }

  stopRain() {
    if (!this.ctx || !this.rainNode || !this.rainGain) return;
    
    // Smooth fade out
    this.rainGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, this.ctx.currentTime);
    this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);

    // Stop after fade
    this.rainStopTimeout = setTimeout(() => {
        if (this.rainNode) {
            this.rainNode.stop();
            this.rainNode.disconnect();
            this.rainNode = null;
        }
        this.rainStopTimeout = null;
    }, 1500);
  }

  playThunder() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // 1. White noise burst (The "Crack")
    const bufferSize = this.ctx.sampleRate * 2.0; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 1.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, this.ctx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    // 2. Low Rumble (Oscillator)
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(50, this.ctx.currentTime);
    rumble.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 2.0);

    rumbleGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.0);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumble.start();
    rumble.stop(this.ctx.currentTime + 2.0);
  }
}

export const soundManager = new SoundManager();
