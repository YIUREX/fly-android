
export type Vector = { x: number; y: number };

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  SHOP = 'SHOP',
  MISSIONS = 'MISSIONS'
}

export enum GameMode {
  NORMAL = 'NORMAL',
  COMPETITION = 'COMPETITION',
  CHILL = 'CHILL'
}

export enum PowerUpType {
  SHIELD = 'SHIELD',
  SPEED = 'SPEED',
  MAGNET = 'MAGNET',
  SHOCKWAVE = 'SHOCKWAVE',
  ALLIES = 'ALLIES'
}

export enum BoostType {
  SHIELD_START = 'SHIELD_START',
  MAGNET_START = 'MAGNET_START',
  SPEED_START = 'SPEED_START'
}

export enum SkyState {
  DAY = 'DAY',
  SUNSET = 'SUNSET',
  PURPLE_SUNSET = 'PURPLE_SUNSET',
  NIGHT = 'NIGHT',
  STORM = 'STORM',
  SNOW = 'SNOW',
  AUTO = 'AUTO'
}

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface PlaneModel {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  path: string; // SVG Path string
  stats: {
      speed: number; // Multiplier (e.g. 1.0, 1.2)
      turn: number;  // Multiplier
  };
  description: string;
}

export interface PlaneSkin {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  color: string;
  secondaryColor: string;
}

export interface TrailStyle {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  color: string; 
  widthScale: number;
  glow: boolean;
  type?: 'line' | 'bubbles' | 'pixel' | 'sparkle' | 'electric';
}

export interface DeathEffectStyle {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  particleColor: string; 
  particleCount: number;
  soundType: 'standard' | 'digital' | 'heavy';
}

export interface BoostItem {
  id: BoostType;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface Entity {
  id: string;
  pos: Vector;
  vel: Vector;
  angle: number;
  radius: number;
  dead: boolean;
  trail: Vector[]; 
}

export interface Ally extends Entity {
  targetId: string | null;
  lifeTime: number;
  orbitOffset: number;
}

export interface Player extends Entity {
  shieldActive: boolean;
  magnetActive: boolean;
  speedBoostActive: boolean;
  modelId: string;
  skinId: string;
  trailId: string;
  deathEffectId: string;
}

export interface Missile extends Entity {
  turnRate: number;
  speed: number;
  wobbleOffset: number;
  grazed?: boolean; // New property for graze mechanic
}

export interface Coin extends Entity {
  value: number;
  magnetized: boolean;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Particle {
  id: string;
  pos: Vector;
  vel: Vector;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number; 
  opacity: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  blinkOffset: number;
}

export interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
}

export interface SnowFlake {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
}

export interface Mission {
  id: number;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number;
  type: 'score' | 'coins' | 'time' | 'missiles';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: (stats: GameStats) => boolean;
  reward: number;
  unlocked: boolean;
}

export interface GameStats {
  totalScore: number;
  totalCoins: number;
  totalTime: number;
  totalMissilesDodged: number;
  maxScore: number;
}

export interface MusicTrack {
  title: string;
  src: string;
}

export interface LootResult {
    item: PlaneModel | PlaneSkin | TrailStyle | DeathEffectStyle;
    type: 'model' | 'skin' | 'trail' | 'effect';
    duplicate: boolean;
    refund: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

declare global {
  interface Window {
    Android?: {
      showRewardedAd: () => void;
    };
  }
}
