

import { PlaneModel, PlaneSkin, PowerUpType, TrailStyle, DeathEffectStyle, Achievement, BoostItem, BoostType, MusicTrack, Rarity, LeaderboardEntry } from './types';

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
  
  // Game Feel
  GRAZE_DISTANCE: 35, // Distance to trigger graze (PlayerRadius + MissileRadius + Margin)
  GRAZE_SCORE: 25,
};

export const LOOT_BOX_PRICE = 500;

export const SKY_COLORS = {
  DAY_TOP: '#38bdf8',    
  DAY_BOTTOM: '#bae6fd', 
  SUNSET_TOP: '#f97316', 
  SUNSET_BOTTOM: '#fecca9',
  PURPLE_SUNSET_TOP: '#4c1d95', // Deep violet
  PURPLE_SUNSET_BOTTOM: '#d946ef', // Fuchsia/Pink
  NIGHT_TOP: '#0f172a',  
  NIGHT_BOTTOM: '#1e293b',
  STORM_TOP: '#1e1b4b',   // Dark indigo/purple
  STORM_BOTTOM: '#334155', // Slate grey
  SNOW_TOP: '#cbd5e1', // Slate 300 - Light Grey/Blueish
  SNOW_BOTTOM: '#f8fafc', // Slate 50 - Almost White
};

export const PLANE_MODELS: PlaneModel[] = [
  // --- THE CLASSICS (Requested Only) ---
  { 
    id: 'default', 
    name: 'Clásico', 
    price: 0, 
    rarity: Rarity.COMMON,
    path: 'M0 -20 L15 20 L0 15 L-15 20 Z', 
    stats: { speed: 1.0, turn: 1.0 },
    description: 'El plegado estándar. Equilibrado y confiable.'
  },
  { 
    id: 'interceptor', 
    name: 'Caza', 
    price: 2500, 
    rarity: Rarity.RARE,
    path: 'M0 -30 L10 20 L0 15 L-10 20 Z', 
    stats: { speed: 1.3, turn: 0.8 },
    description: 'Diseño militar rápido, ideal para huidas rectas.'
  },
  { 
    id: 'glider', 
    name: 'Planeador', 
    price: 3000, 
    rarity: Rarity.EPIC,
    path: 'M0 -15 L25 10 L0 12 L-25 10 Z', 
    stats: { speed: 0.8, turn: 1.4 },
    description: 'Alas anchas para giros cerrados y vuelo suave.'
  },
  { 
    id: 'stunt', 
    name: 'Acróbata', 
    price: 8000, 
    rarity: Rarity.EPIC,
    path: 'M0 -25 L20 10 L5 20 L0 15 L-5 20 L-20 10 Z', 
    stats: { speed: 1.1, turn: 1.3 },
    description: 'Diseño invertido para maniobras extremas.'
  },
  { 
    id: 'valkyrie', 
    name: 'Delta', 
    price: 11000, 
    rarity: Rarity.LEGENDARY,
    path: 'M0 -25 L22 20 L0 10 L-22 20 Z', 
    stats: { speed: 1.35, turn: 1.1 },
    description: 'Ala delta futurista. Alta velocidad y control.'
  }
];

export const PLANE_SKINS: PlaneSkin[] = [
  // --- BASICS ---
  { id: 'default', name: 'Papel Blanco', price: 0, rarity: Rarity.COMMON, color: '#f8fafc', secondaryColor: '#94a3b8' },
  { id: 'notebook', name: 'Cuaderno', price: 500, rarity: Rarity.COMMON, color: '#f1f5f9', secondaryColor: '#3b82f6' },
  { id: 'cardboard', name: 'Cartón', price: 800, rarity: Rarity.RARE, color: '#d4a373', secondaryColor: '#a98467' },
  { id: 'blueprint', name: 'Plano', price: 1200, rarity: Rarity.RARE, color: '#1e3a8a', secondaryColor: '#93c5fd' },
  
  // --- COLORS & SPECIALS ---
  { id: 'origami_red', name: 'Origami Rojo', price: 1500, rarity: Rarity.RARE, color: '#ef4444', secondaryColor: '#b91c1c' },
  { id: 'midnight', name: 'Medianoche', price: 2200, rarity: Rarity.EPIC, color: '#0f172a', secondaryColor: '#64748b' },
  { id: 'magma', name: 'Magma', price: 2500, rarity: Rarity.EPIC, color: '#ef4444', secondaryColor: '#facc15' },
  { id: 'ice', name: 'Hielo', price: 2500, rarity: Rarity.EPIC, color: '#ecfeff', secondaryColor: '#06b6d4' },
  { id: 'forest_camo', name: 'Camo Bosque', price: 2800, rarity: Rarity.EPIC, color: '#166534', secondaryColor: '#14532d' },
  { id: 'arctic_camo', name: 'Camo Ártico', price: 2800, rarity: Rarity.EPIC, color: '#e0f2fe', secondaryColor: '#94a3b8' },
  
  // --- PREMIUM ---
  { id: 'vaporwave', name: 'Vaporwave', price: 3500, rarity: Rarity.LEGENDARY, color: '#f472b6', secondaryColor: '#22d3ee' },
  { id: 'matrix', name: 'Matrix', price: 4000, rarity: Rarity.LEGENDARY, color: '#000000', secondaryColor: '#22c55e' },
  { id: 'golden', name: 'Pan de Oro', price: 5000, rarity: Rarity.LEGENDARY, color: '#fbbf24', secondaryColor: '#b45309' },
];

export const TRAILS: TrailStyle[] = [
  // --- STANDARD ---
  { id: 'default', name: 'Humo Blanco', price: 0, rarity: Rarity.COMMON, color: 'rgba(255,255,255,0.4)', widthScale: 1, glow: false, type: 'line' },
  { id: 'smoke', name: 'Humo Negro', price: 300, rarity: Rarity.COMMON, color: 'rgba(0,0,0,0.4)', widthScale: 1.2, glow: false, type: 'bubbles' },
  { id: 'ink', name: 'Tinta', price: 400, rarity: Rarity.RARE, color: '#1e293b', widthScale: 1, glow: false, type: 'bubbles' },
  
  // --- SPECIALS ---
  { id: 'fire', name: 'Fuego', price: 800, rarity: Rarity.EPIC, color: '#f59e0b', widthScale: 1.2, glow: true, type: 'line' },
  { id: 'bubbles', name: 'Burbujas', price: 700, rarity: Rarity.RARE, color: '#60a5fa', widthScale: 1.5, glow: false, type: 'bubbles' },
  
  // --- REQUESTED FANCY ---
  { id: 'sparkle', name: 'Polvo Estelar', price: 1000, rarity: Rarity.EPIC, color: '#f472b6', widthScale: 1, glow: true, type: 'sparkle' },
  { id: 'pixel', name: 'Pixel', price: 1200, rarity: Rarity.EPIC, color: '#4ade80', widthScale: 1.5, glow: false, type: 'pixel' },
  { id: 'electric', name: 'Alto Voltaje', price: 1500, rarity: Rarity.LEGENDARY, color: '#22d3ee', widthScale: 0.8, glow: true, type: 'electric' },
  { id: 'rainbow', name: 'Arcoíris', price: 2000, rarity: Rarity.LEGENDARY, color: 'rainbow', widthScale: 1.5, glow: false, type: 'line' },
  { id: 'matrix', name: 'Matrix', price: 1800, rarity: Rarity.LEGENDARY, color: '#22c55e', widthScale: 1, glow: true, type: 'pixel' },
];

export const DEATH_EFFECTS: DeathEffectStyle[] = [
  { id: 'default', name: 'Explosión', price: 0, rarity: Rarity.COMMON, particleColor: '#ef4444', particleCount: 40, soundType: 'standard' },
  { id: 'paper_shreds', name: 'Trituradora', price: 500, rarity: Rarity.RARE, particleColor: '#ffffff', particleCount: 60, soundType: 'standard' },
  { id: 'ink_splash', name: 'Mancha Tinta', price: 800, rarity: Rarity.EPIC, particleColor: '#1e293b', particleCount: 80, soundType: 'heavy' },
  { id: 'glitch', name: 'Glitch', price: 1000, rarity: Rarity.EPIC, particleColor: '#22c55e', particleCount: 50, soundType: 'digital' },
  { id: 'confetti', name: 'Fiesta', price: 1200, rarity: Rarity.LEGENDARY, particleColor: 'random', particleCount: 100, soundType: 'digital' },
  { id: 'nuclear', name: 'Nuclear', price: 1500, rarity: Rarity.LEGENDARY, particleColor: '#84cc16', particleCount: 150, soundType: 'heavy' },
  { id: 'black_hole', name: 'Agujero Negro', price: 1800, rarity: Rarity.LEGENDARY, particleColor: '#000000', particleCount: 20, soundType: 'heavy' },
  { id: 'electric_boom', name: 'Trueno', price: 1600, rarity: Rarity.LEGENDARY, particleColor: '#facc15', particleCount: 70, soundType: 'heavy' },
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
  { 
    id: 'hero_complex', 
    title: 'Héroe', 
    description: 'Ten Escudo, Turbo y Aliados a la vez', 
    condition: () => false, // Handled manually in App.tsx
    reward: 1000, 
    unlocked: false 
  },
  { 
    id: 'minecraft_advancement', 
    title: '¿Cómo llegamos hasta aquí?', 
    description: 'Consigue 100.000 puntos', 
    condition: (stats) => stats.maxScore >= 100000, 
    reward: 5000, 
    unlocked: false 
  },
];

export const MUSIC_PLAYLIST: MusicTrack[] = [
  { title: "Almost", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Almost.mp3" },
  { title: "Better Days", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/BetterDays.mp3" },
  { title: "Chill Day", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/ChillDay.mp3" },
  { title: "Comfort Chain", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/ComfortChain.mp3" },
  { title: "Cornfield Chase", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/CornfieldChase.mp3" },
  { title: "Fallen Down", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/FallenDown.mp3" },
  { title: "Gods Creation", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/GodsCreation.mp3" },
  { title: "Hopeless Romantic", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/HopelessRomantic.mp3" },
  { title: "Interstellar (ambient)", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Interstellar(ambient).mp3" },
  { title: "Interstellar", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Interstellar.mp3" },
  { title: "Just Give Me One More Day", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/JustGiveMeOneMoreDay.mp3" },
  { title: "September", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/September.mp3" },
  { title: "Sweetly", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Sweetly.mp3" },
  { title: "Time", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/Time.mp3" },
  { title: "What Could Have Been", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/What%20Could%20Have%20Been.mp3" },
  { title: "Ylang Ylang", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/YlangYlang.mp3" },
  { title: "[oops]", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/[oops].mp3" },
  { title: "apathy", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/apathy.mp3" },
  { title: "For the green eyes girl", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/forthegreeneyesgirl.mp3" },
  { title: "the feeling of a first kiss", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/thefeelingofafirstkiss.mp3" },
  { title: "for the blonde hair girl", src: "https://raw.githubusercontent.com/YIUREX/fly-audio/main/fortheblondehairgirl.mp3" }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [];
