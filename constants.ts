
import { PlaneModel, PlaneSkin, PowerUpType, TrailStyle, DeathEffectStyle, Achievement, BoostItem, BoostType, MusicTrack } from './types';

export const GAME_CONFIG = {
  PLAYER_SPEED: 5.5,
  PLAYER_BOOST_SPEED: 9,
  PLAYER_TURN_SPEED: 0.12,
  PLAYER_RADIUS: 14,
  
  MISSILE_SPAWN_RATE: 100, // Frames
  MISSILE_BASE_SPEED: 4,
  MISSILE_TURN_RATE: 0.045,
  MISSILE_RADIUS: 7,
  
  COIN_SPAWN_RATE: 100,
  POWERUP_SPAWN_RATE: 600,
  
  FRICTION: 0.96,
  TRAIL_LENGTH: 30,
  
  // World Management
  SPAWN_DISTANCE_OFFSET: 100,
  DESPAWN_DISTANCE: 2000,

  // Cycle
  CYCLE_DURATION: 4500, 
};

export const SKY_COLORS = {
  DAY_TOP: '#38bdf8',    
  DAY_BOTTOM: '#bae6fd', 
  SUNSET_TOP: '#f97316', 
  SUNSET_BOTTOM: '#fecca9',
  NIGHT_TOP: '#0f172a',  
  NIGHT_BOTTOM: '#1e293b',
  STORM_TOP: '#1e1b4b',   // Dark indigo/purple
  STORM_BOTTOM: '#334155', // Slate grey
  SNOW_TOP: '#cbd5e1', // Slate 300 - Light Grey/Blueish
  SNOW_BOTTOM: '#f8fafc', // Slate 50 - Almost White
};

export const PLANE_MODELS: PlaneModel[] = [
  { 
    id: 'default', 
    name: 'Clásico', 
    price: 0, 
    path: 'M0 -20 L15 20 L0 15 L-15 20 Z', 
    stats: { speed: 1.0, turn: 1.0 },
    description: 'Equilibrado y confiable.'
  },
  { 
    id: 'fighter', 
    name: 'Caza', 
    price: 2500, 
    path: 'M0 -30 L10 20 L0 15 L-10 20 Z', 
    stats: { speed: 1.2, turn: 0.8 },
    description: 'Alta velocidad, giro reducido.'
  },
  { 
    id: 'glider', 
    name: 'Planeador', 
    price: 3000, 
    path: 'M0 -15 L25 10 L0 15 L-25 10 Z', 
    stats: { speed: 0.8, turn: 1.3 },
    description: 'Lento pero muy ágil.'
  },
  { 
    id: 'stunt', 
    name: 'Acróbata', 
    price: 4000, 
    path: 'M0 -20 L15 10 L0 20 L-15 10 Z', 
    stats: { speed: 1.05, turn: 1.15 },
    description: 'Diseño agresivo de ala invertida.'
  },
  { 
    id: 'delta', 
    name: 'Delta X', 
    price: 8000, 
    path: 'M0 -25 L20 20 L0 18 L-20 20 Z', 
    stats: { speed: 1.15, turn: 1.15 },
    description: 'Tecnología punta. Rápido y ágil.'
  }
];

export const PLANE_SKINS: PlaneSkin[] = [
  { id: 'default', name: 'Papel Blanco', price: 0, color: '#f8fafc', secondaryColor: '#94a3b8' },
  { id: 'neon_cyan', name: 'Cyber Cyan', price: 500, color: '#06b6d4', secondaryColor: '#22d3ee' },
  { id: 'plasma_pink', name: 'Plasma Pink', price: 500, color: '#db2777', secondaryColor: '#f472b6' },
  { id: 'golden', name: 'Oro Puro', price: 1500, color: '#eab308', secondaryColor: '#facc15' },
  { id: 'stealth', name: 'Operaciones', price: 1000, color: '#1e293b', secondaryColor: '#475569' },
  { id: 'inferno', name: 'Inferno', price: 1000, color: '#ef4444', secondaryColor: '#fca5a5' },
  { id: 'toxic', name: 'Tóxico', price: 800, color: '#84cc16', secondaryColor: '#bef264' },
];

export const TRAILS: TrailStyle[] = [
  { id: 'default', name: 'Humo Blanco', price: 0, color: 'rgba(255,255,255,0.4)', widthScale: 1, glow: false, type: 'line' },
  { id: 'fire', name: 'Propulsor Fuego', price: 300, color: '#f59e0b', widthScale: 1.2, glow: true, type: 'line' },
  { id: 'bubbles', name: 'Burbujas', price: 400, color: '#60a5fa', widthScale: 1, glow: false, type: 'bubbles' },
  { id: 'pixel', name: 'Pixel Retro', price: 600, color: '#10b981', widthScale: 1, glow: true, type: 'pixel' },
  { id: 'sparkle', name: 'Polvo Estelar', price: 750, color: '#f472b6', widthScale: 1, glow: true, type: 'sparkle' },
  { id: 'electric', name: 'Alto Voltaje', price: 900, color: '#facc15', widthScale: 0.8, glow: true, type: 'electric' },
  { id: 'rainbow', name: 'Arcoíris', price: 800, color: 'rainbow', widthScale: 1.5, glow: false, type: 'line' },
  { id: 'matrix', name: 'Matrix', price: 500, color: '#22c55e', widthScale: 0.8, glow: true, type: 'line' },
];

export const DEATH_EFFECTS: DeathEffectStyle[] = [
  { id: 'default', name: 'Explosión', price: 0, particleColor: '#ef4444', particleCount: 40, soundType: 'standard' },
  { id: 'confetti', name: 'Fiesta', price: 400, particleColor: 'random', particleCount: 80, soundType: 'digital' },
  { id: 'nuclear', name: 'Nuclear', price: 1000, particleColor: '#84cc16', particleCount: 100, soundType: 'heavy' },
];

export const BOOSTS: BoostItem[] = [
  { id: BoostType.SHIELD_START, name: 'Escudo Inicial', description: 'Empieza con escudo (10s)', price: 50, icon: '🛡️' },
  { id: BoostType.MAGNET_START, name: 'Imán Inicial', description: 'Empieza con imán (15s)', price: 50, icon: '🧲' },
  { id: BoostType.SPEED_START, name: 'Despegue Rápido', description: 'Empieza con turbo (5s)', price: 50, icon: '🚀' },
];

export const POWERUP_COLORS = {
  [PowerUpType.SHIELD]: '#60a5fa', // Blue
  [PowerUpType.SPEED]: '#facc15',  // Yellow
  [PowerUpType.MAGNET]: '#c084fc', // Purple
  [PowerUpType.SHOCKWAVE]: '#ef4444', // Red
  [PowerUpType.ALLIES]: '#22d3ee', // Cyan
};

export const POWERUP_LABELS = {
  [PowerUpType.SHIELD]: 'ESCUDO',
  [PowerUpType.SPEED]: 'TURBO',
  [PowerUpType.MAGNET]: 'IMÁN',
  [PowerUpType.SHOCKWAVE]: 'OLA CHOQUE',
  [PowerUpType.ALLIES]: 'ALIADOS',
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { 
    id: 'survivor_1', 
    title: 'Novato', 
    description: 'Consigue 500 puntos en una partida', 
    condition: (stats) => stats.maxScore >= 500, 
    reward: 100, 
    unlocked: false 
  },
  { 
    id: 'rich_1', 
    title: 'Ahorrador', 
    description: 'Ten 500 monedas en el banco', 
    condition: (stats) => stats.totalCoins >= 500, 
    reward: 200, 
    unlocked: false 
  },
  { 
    id: 'dodger_1', 
    title: 'Intocable', 
    description: 'Esquiva 100 misiles (Total)', 
    condition: (stats) => stats.totalMissilesDodged >= 100, 
    reward: 300, 
    unlocked: false 
  },
];

export const MUSIC_PLAYLIST: MusicTrack[] = [
  { title: "Interstellar", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Interstellar.mp3" },
  { title: "Sweetly", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Sweetly.mp3" },
  { title: "Gods Creation", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/GodsCreation.mp3" },
  { title: "Ylang Ylang", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/YlangYlang.mp3" },
  { title: "Hopeless Romantic", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/HopelessRomantic.mp3" },
  { title: "Better Days", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/BetterDays.mp3" },
  { title: "Comfort Chain", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/ComfortChain.mp3" }
];
