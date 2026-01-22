
import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Missile, Particle, Coin, PowerUp, PowerUpType, Vector, Entity, Cloud, Star, SkyState, Ally, BoostType, TrailStyle, RainDrop, SnowFlake, Rarity, GameMode } from '../types';
import { GAME_CONFIG, POWERUP_COLORS, PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS, SKY_COLORS } from '../constants';
import { vecAdd, vecSub, vecMult, vecNorm, vecLen, dist, randomRange, lerp, lerpColor, soundManager } from '../utils';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setCoinsCollected: (coins: number) => void;
  currentModelId: string;
  currentSkinId: string;
  currentTrailId: string;
  currentDeathEffectId: string;
  addCoins: (amount: number) => void;
  activePowerUps: PowerUpType[];
  setActivePowerUps: React.Dispatch<React.SetStateAction<PowerUpType[]>>;
  skyState: SkyState;
  reviveSignal: number;
  onMissionUpdate: (type: string, amount: number) => void;
  initialBoosts: BoostType[];
  gameMode: GameMode;
}

const GameCanvasComponent: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  setScore, 
  setCoinsCollected, 
  currentModelId,
  currentSkinId,
  currentTrailId,
  currentDeathEffectId,
  addCoins,
  activePowerUps,
  setActivePowerUps,
  skyState,
  reviveSignal,
  onMissionUpdate,
  initialBoosts,
  gameMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const prevGameState = useRef<GameState>(gameState);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const joystickRef = useRef<{ active: boolean; origin: Vector; current: Vector } | null>(null);
  const cameraRef = useRef<Vector>({ x: 0, y: 0 });

  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    angle: 0,
    radius: GAME_CONFIG.PLAYER_RADIUS,
    dead: false,
    shieldActive: false,
    magnetActive: false,
    speedBoostActive: false,
    modelId: 'default',
    skinId: 'default',
    trailId: 'default',
    deathEffectId: 'default',
    trail: []
  });

  const missilesRef = useRef<Missile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const alliesRef = useRef<Ally[]>([]); 
  
  const cloudsRef = useRef<Cloud[]>([]);
  const starsRef = useRef<Star[]>([]);
  const raindropsRef = useRef<RainDrop[]>([]);
  const snowflakesRef = useRef<SnowFlake[]>([]);

  const cycleFrameRef = useRef(0);
  const stormIntensityRef = useRef(0); // 0 to 1
  const snowIntensityRef = useRef(0); // 0 to 1
  const isStormingInAutoRef = useRef(false);
  const isSnowingInAutoRef = useRef(false);
  const autoWeatherTimerRef = useRef(0);
  const lightningTimerRef = useRef(0);
  const lightningAlphaRef = useRef(0);
  const isRainPlayingRef = useRef(false);
  
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const scoreMissionAccumulatorRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const gameTimeRef = useRef(0);

  const initBackground = useCallback(() => {
    const newClouds: Cloud[] = [];
    for (let i = 0; i < 20; i++) {
      newClouds.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        scale: 1 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.3,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
    cloudsRef.current = newClouds;

    const newStars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      newStars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 2 + 1,
        speed: 0.05 + Math.random() * 0.1,
        blinkOffset: Math.random() * 10
      });
    }
    starsRef.current = newStars;

    const newRain: RainDrop[] = [];
    for(let i=0; i<150; i++) {
        newRain.push({
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            length: Math.random() * 20 + 10,
            speed: Math.random() * 10 + 15
        });
    }
    raindropsRef.current = newRain;

    const newSnow: SnowFlake[] = [];
    for(let i=0; i<200; i++) {
        newSnow.push({
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 1,
            drift: Math.random() * Math.PI * 2
        });
    }
    snowflakesRef.current = newSnow;
  }, []);

  const initGame = useCallback(() => {
    soundManager.init();
    if (!canvasRef.current) return;
    
    playerRef.current = {
      id: 'player',
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      radius: GAME_CONFIG.PLAYER_RADIUS,
      dead: false,
      shieldActive: false,
      magnetActive: false,
      speedBoostActive: false,
      modelId: currentModelId,
      skinId: currentSkinId,
      trailId: currentTrailId,
      deathEffectId: currentDeathEffectId,
      trail: []
    };
    
    cameraRef.current = { x: 0, y: 0 };
    missilesRef.current = [];
    particlesRef.current = [];
    coinsRef.current = [];
    powerUpsRef.current = [];
    alliesRef.current = [];
    joystickRef.current = null;
    scoreRef.current = 0;
    scoreMissionAccumulatorRef.current = 0;
    coinsCollectedRef.current = 0;
    frameCountRef.current = 0;
    gameTimeRef.current = 0;
    cycleFrameRef.current = 0;
    stormIntensityRef.current = 0;
    snowIntensityRef.current = 0;
    isStormingInAutoRef.current = false;
    isSnowingInAutoRef.current = false;
    autoWeatherTimerRef.current = 0;
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    initBackground();
    setScore(0);
    setCoinsCollected(0);
    const active: PowerUpType[] = [];
    if (initialBoosts.includes(BoostType.SHIELD_START)) {
        playerRef.current.shieldActive = true;
        active.push(PowerUpType.SHIELD);
        setTimeout(() => { playerRef.current.shieldActive = false; setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.SHIELD)); }, 10000);
    }
    if (initialBoosts.includes(BoostType.MAGNET_START)) {
        playerRef.current.magnetActive = true;
        active.push(PowerUpType.MAGNET);
        setTimeout(() => { playerRef.current.magnetActive = false; setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.MAGNET)); }, 15000);
    }
    if (initialBoosts.includes(BoostType.SPEED_START)) {
        playerRef.current.speedBoostActive = true;
        active.push(PowerUpType.SPEED);
        setTimeout(() => { playerRef.current.speedBoostActive = false; setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.SPEED)); }, 5000);
    }
    setActivePowerUps(active);
  }, [currentModelId, currentSkinId, currentTrailId, currentDeathEffectId, setScore, setCoinsCollected, setActivePowerUps, initBackground, initialBoosts]);

  useEffect(() => {
    initBackground();
    soundManager.init();
    return () => { soundManager.stopRain(); isRainPlayingRef.current = false; }
  }, [initBackground]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (reviveSignal > 0) {
      playerRef.current.dead = false;
      playerRef.current.shieldActive = true; 
      missilesRef.current = [];
      setActivePowerUps(prev => { if (prev.includes(PowerUpType.SHIELD)) return prev; return [...prev, PowerUpType.SHIELD]; });
      timer = setTimeout(() => { playerRef.current.shieldActive = false; setActivePowerUps(prev => prev.filter(t => t !== PowerUpType.SHIELD)); }, 5000);
      prevGameState.current = GameState.PLAYING;
    }
    return () => clearTimeout(timer);
  }, [reviveSignal, setActivePowerUps]);

  useEffect(() => {
    const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const worldToScreen = (pos: Vector, width: number, height: number): Vector => ({ x: pos.x - cameraRef.current.x + width / 2, y: pos.y - cameraRef.current.y + height / 2 });

  const createExplosion = (pos: Vector, color: string, count: number = 15, isEnemyDeath: boolean = false) => {
    soundManager.playExplosion();
    const effectStyle = isEnemyDeath ? DEATH_EFFECTS.find(e => e.id === playerRef.current.deathEffectId) : null;
    const particleCount = effectStyle ? effectStyle.particleCount : count;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const pColor = (effectStyle && effectStyle.particleColor === 'random') ? `hsl(${Math.random() * 360}, 100%, 50%)` : (effectStyle?.particleColor ? effectStyle.particleColor : color);
      particlesRef.current.push({ id: Math.random().toString(), pos: { ...pos }, vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, life: 1.0, maxLife: 1.0, color: pColor, size: Math.random() * 5 + 2 });
    }
  };

  const spawnShockwave = (pos: Vector) => {
    soundManager.playShockwave();
    for(let i=0; i<36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      particlesRef.current.push({ id: Math.random().toString(), pos: { ...pos }, vel: { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 }, life: 0.8, maxLife: 0.8, color: '#60a5fa', size: 5 });
    }
    if (missilesRef.current.length > 0) {
        onMissionUpdate('missiles', missilesRef.current.length);
        missilesRef.current.forEach(m => { createExplosion(m.pos, '#ef4444', 5, true); scoreRef.current += 50; onMissionUpdate('score', 50); });
    }
    missilesRef.current = [];
  };

  const spawnAllies = (pos: Vector) => {
    for(let i=0; i<3; i++) {
        alliesRef.current.push({ id: i.toString(), pos: vecAdd(pos, {x: Math.random()*50-25, y: Math.random()*50-25}), vel: {x: 0, y: 0}, angle: Math.random() * Math.PI * 2, radius: 8, dead: false, trail: [], targetId: null, lifeTime: 600, orbitOffset: (i * (Math.PI * 2)) / 3 });
    }
  };

  const getRandomSpawnPos = (width: number, height: number): Vector => {
    const angle = Math.random() * Math.PI * 2;
    const screenDiag = Math.sqrt(width * width + height * height) / 2;
    const distance = screenDiag + GAME_CONFIG.SPAWN_DISTANCE_OFFSET;
    return { x: cameraRef.current.x + Math.cos(angle) * distance, y: cameraRef.current.y + Math.sin(angle) * distance };
  };

  const spawnMissile = (width: number, height: number, difficultyMultiplier: number) => {
    const startPos = getRandomSpawnPos(width, height);
    missilesRef.current.push({ id: Math.random().toString(), pos: startPos, vel: { x: 0, y: 0 }, angle: 0, radius: GAME_CONFIG.MISSILE_RADIUS, dead: false, turnRate: GAME_CONFIG.MISSILE_TURN_RATE * difficultyMultiplier, speed: GAME_CONFIG.MISSILE_BASE_SPEED * difficultyMultiplier, wobbleOffset: Math.random() * 100, trail: [], grazed: false });
  };

  const spawnCoin = (width: number, height: number) => {
    coinsRef.current.push({ id: Math.random().toString(), pos: getRandomSpawnPos(width, height), vel: { x: 0, y: 0 }, angle: 0, radius: 12, dead: false, value: 10, magnetized: false, trail: [] });
  };

  const spawnPowerUp = (width: number, height: number) => {
    const types = [PowerUpType.SHIELD, PowerUpType.SPEED, PowerUpType.MAGNET, PowerUpType.SHOCKWAVE, PowerUpType.ALLIES];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({ id: Math.random().toString(), pos: getRandomSpawnPos(width, height), vel: { x: 0, y: 0 }, angle: 0, radius: 14, dead: false, type: type, trail: [] });
  };

  const activatePowerUp = (type: PowerUpType) => {
    const p = playerRef.current;
    if (type === PowerUpType.SHIELD) {
      p.shieldActive = true;
      setTimeout(() => { p.shieldActive = false; setActivePowerUps(prev => prev.filter(t => t !== PowerUpType.SHIELD)); }, 5000);
    } else if (type === PowerUpType.MAGNET) {
      p.magnetActive = true;
      setTimeout(() => { p.magnetActive = false; setActivePowerUps(prev => prev.filter(t => t !== PowerUpType.MAGNET)); }, 8000);
    } else if (type === PowerUpType.SPEED) {
      p.speedBoostActive = true;
      setTimeout(() => { p.speedBoostActive = false; setActivePowerUps(prev => prev.filter(t => t !== PowerUpType.SPEED)); }, 5000);
    } else if (type === PowerUpType.SHOCKWAVE) { spawnShockwave(p.pos); return; } else if (type === PowerUpType.ALLIES) { spawnAllies(p.pos); }
    setActivePowerUps(prev => [...prev.filter(t => t !== type), type]);
  };

  const updateTrail = (entity: Entity, currentPos: Vector, freq: number = 2) => {
    if (frameCountRef.current % freq === 0) {
      entity.trail.push({ ...currentPos });
      if (entity.trail.length > GAME_CONFIG.TRAIL_LENGTH) entity.trail.shift();
    }
  };

  const fixedUpdate = useCallback((width: number, height: number) => {
    frameCountRef.current++;
    gameTimeRef.current += 1/60;
    
    if (skyState === SkyState.AUTO) {
        cycleFrameRef.current++;
        if (!isStormingInAutoRef.current && !isSnowingInAutoRef.current) {
            const roll = Math.random();
            const weatherChance = 0.00001;
            if (roll < weatherChance) { isStormingInAutoRef.current = true; autoWeatherTimerRef.current = 1200; }
            else if (roll < weatherChance * 2) { isSnowingInAutoRef.current = true; autoWeatherTimerRef.current = 1500; }
        } else {
            autoWeatherTimerRef.current--;
            if (autoWeatherTimerRef.current <= 0) { isStormingInAutoRef.current = false; isSnowingInAutoRef.current = false; }
        }
        stormIntensityRef.current = lerp(stormIntensityRef.current, isStormingInAutoRef.current ? 1 : 0, 0.01);
        snowIntensityRef.current = lerp(snowIntensityRef.current, isSnowingInAutoRef.current ? 1 : 0, 0.01);
    } else if (skyState === SkyState.STORM) { stormIntensityRef.current = 1; snowIntensityRef.current = 0; }
    else if (skyState === SkyState.SNOW) { stormIntensityRef.current = 0; snowIntensityRef.current = 1; }
    else { stormIntensityRef.current = 0; snowIntensityRef.current = 0; }

    if (stormIntensityRef.current > 0.5) {
        if (lightningTimerRef.current <= 0) {
            if (Math.random() < 0.01) { lightningTimerRef.current = 10; lightningAlphaRef.current = 0.8; soundManager.playThunder(); }
        } else { lightningTimerRef.current--; lightningAlphaRef.current *= 0.8; }
    } else { lightningAlphaRef.current = 0; }

    if (stormIntensityRef.current > 0) {
        raindropsRef.current.forEach(d => {
            d.y += d.speed; d.x -= d.speed * 0.2;
            const screenY = d.y - cameraRef.current.y;
            if (screenY > height/2 + 1000) { d.y -= 2000; d.x = cameraRef.current.x + Math.random() * 2000 - 1000; }
        });
    }

    if (snowIntensityRef.current > 0) {
        snowflakesRef.current.forEach(s => {
            s.y += s.speed * 0.5; s.x += Math.sin(gameTimeRef.current + s.drift) * 0.5;
            const screenY = s.y - cameraRef.current.y;
            if (screenY > height/2 + 500) { s.y -= 1500; s.x = cameraRef.current.x + Math.random() * 2000 - 1000; }
        });
    }

    const difficultyMultiplier = gameMode === GameMode.CHILL ? 1 : (1 + Math.min(scoreRef.current / 3000, 1.2));

    if (frameCountRef.current % Math.floor(GAME_CONFIG.MISSILE_SPAWN_RATE / difficultyMultiplier) === 0) spawnMissile(width, height, difficultyMultiplier);
    if (frameCountRef.current % GAME_CONFIG.COIN_SPAWN_RATE === 0 && coinsRef.current.length < 10) spawnCoin(width, height);
    if (frameCountRef.current % GAME_CONFIG.POWERUP_SPAWN_RATE === 0 && powerUpsRef.current.length < 3) spawnPowerUp(width, height);

    const p = playerRef.current;
    const model = PLANE_MODELS.find(m => m.id === p.modelId) || PLANE_MODELS[0];
    if (joystickRef.current && joystickRef.current.active) {
      const { origin, current } = joystickRef.current;
      const diff = vecSub(current, origin);
      const len = vecLen(diff);
      if (len > 10) { 
        const targetAngle = Math.atan2(diff.y, diff.x);
        let angleDiff = targetAngle - p.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const turnSpeed = GAME_CONFIG.PLAYER_TURN_SPEED * model.stats.turn;
        p.angle += Math.max(-turnSpeed, Math.min(turnSpeed, angleDiff));
      }
    }

    const baseSpeed = p.speedBoostActive ? GAME_CONFIG.PLAYER_BOOST_SPEED : GAME_CONFIG.PLAYER_SPEED;
    const currentSpeed = baseSpeed * model.stats.speed;
    p.pos = vecAdd(p.pos, { x: Math.cos(p.angle) * currentSpeed, y: Math.sin(p.angle) * currentSpeed });
    cameraRef.current.x = lerp(cameraRef.current.x, p.pos.x, 0.1);
    cameraRef.current.y = lerp(cameraRef.current.y, p.pos.y, 0.1);
    updateTrail(p, { x: p.pos.x - Math.cos(p.angle) * 18, y: p.pos.y - Math.sin(p.angle) * 18 }, 2);

    if (p.skinId === 'legend_gold' && !p.dead && frameCountRef.current % 5 === 0) {
        particlesRef.current.push({
            id: Math.random().toString(),
            pos: vecAdd(p.pos, {x: (Math.random()-0.5)*20, y: (Math.random()-0.5)*20}),
            vel: {x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2},
            life: 0.8,
            maxLife: 0.8,
            color: '#FFD700',
            size: Math.random() * 3 + 1
        });
    }

    alliesRef.current.forEach(ally => {
        let nearestDist = 9999;
        let target: Missile | null = null;
        missilesRef.current.forEach(m => { const d = dist(ally.pos, m.pos); if (d < nearestDist) { nearestDist = d; target = m; } });
        if (target && nearestDist < 500) {
            ally.angle = Math.atan2(target.pos.y - ally.pos.y, target.pos.x - ally.pos.x);
            if (nearestDist < 20) { 
                target.dead = true; 
                ally.dead = true; 
                createExplosion(target.pos, '#22d3ee', 10, true); 
                scoreRef.current += 50; 
                onMissionUpdate('score', 50);
                onMissionUpdate('missiles', 1); // Contar destrucción por aliados
            }
        } else {
            const time = frameCountRef.current * 0.05 + (ally.orbitOffset || 0);
            const targetPos = { x: p.pos.x + Math.cos(time) * 60, y: p.pos.y + Math.sin(time) * 60 };
            ally.angle = Math.atan2(targetPos.y - ally.pos.y, targetPos.x - ally.pos.x);
        }
        ally.pos = vecAdd(ally.pos, { x: Math.cos(ally.angle) * 7, y: Math.sin(ally.angle) * 7 });
        ally.lifeTime--;
        if (ally.lifeTime <= 0) ally.dead = true;
        updateTrail(ally, { x: ally.pos.x - Math.cos(ally.angle) * 8, y: ally.pos.y - Math.sin(ally.angle) * 8 }, 4);
    });
    alliesRef.current = alliesRef.current.filter(a => !a.dead);
    if (activePowerUps.includes(PowerUpType.ALLIES) && alliesRef.current.length === 0) setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.ALLIES));

    missilesRef.current.forEach(m => {
      const angleToPlayer = Math.atan2(p.pos.y - m.pos.y, p.pos.x - m.pos.x);
      let angleDiff = angleToPlayer - m.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      m.angle += Math.max(-m.turnRate, Math.min(m.turnRate, angleDiff));
      const desiredVelocity = { x: Math.cos(m.angle) * m.speed, y: Math.sin(m.angle) * m.speed };
      if (m.vel.x === 0 && m.vel.y === 0) m.vel = desiredVelocity; else { m.vel.x += (desiredVelocity.x - m.vel.x) * 0.05; m.vel.y += (desiredVelocity.y - m.vel.y) * 0.05; }
      m.pos = vecAdd(m.pos, m.vel);
      updateTrail(m, { x: m.pos.x - Math.cos(m.angle) * 10, y: m.pos.y - Math.sin(m.angle) * 10 }, 2);
      const d = dist(m.pos, p.pos);
      if (!m.grazed && !m.dead && !p.dead && d < GAME_CONFIG.GRAZE_DISTANCE) {
          m.grazed = true; 
          scoreRef.current += GAME_CONFIG.GRAZE_SCORE; 
          onMissionUpdate('score', GAME_CONFIG.GRAZE_SCORE);
          // La telemetría de App.tsx cuenta el dodge basándose en el score de 25
          for(let i=0; i<3; i++) particlesRef.current.push({ id: Math.random().toString(), pos: vecAdd(p.pos, vecMult(vecNorm(vecSub(p.pos, m.pos)), -p.radius)), vel: { x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5 }, life: 0.5, maxLife: 0.5, color: '#22d3ee', size: 2 });
      }
      if (d < m.radius + p.radius - 5 && !p.dead) {
        if (p.shieldActive) { 
            m.dead = true; 
            createExplosion(m.pos, '#60a5fa', 10, true); 
            scoreRef.current += 50; 
            onMissionUpdate('score', 50); 
            onMissionUpdate('missiles', 1); // Contar destrucción por escudo
        }
        else { p.dead = true; createExplosion(p.pos, '#f472b6', 40, false); soundManager.playGameOver(); setGameState(GameState.GAMEOVER); }
      }
      missilesRef.current.forEach(otherM => {
        if (m === otherM || otherM.dead) return;
        if (dist(m.pos, otherM.pos) < m.radius + otherM.radius) { 
            m.dead = true; 
            otherM.dead = true; 
            createExplosion(m.pos, '#facc15', 20, true); 
            scoreRef.current += 100; 
            onMissionUpdate('score', 100); 
            setScore(Math.floor(scoreRef.current)); 
            onMissionUpdate('missiles', 2); // Contar destrucción por colisión mutua
        }
      });
      if (dist(m.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) m.dead = true;
    });
    missilesRef.current = missilesRef.current.filter(m => !m.dead);

    coinsRef.current.forEach(c => {
      if (p.magnetActive && dist(c.pos, p.pos) < 350) c.magnetized = true;
      if (c.magnetized) c.pos = vecAdd(c.pos, vecMult(vecNorm(vecSub(p.pos, c.pos)), 14));
      if (dist(c.pos, p.pos) < c.radius + p.radius) { c.dead = true; coinsCollectedRef.current += c.value; setCoinsCollected(coinsCollectedRef.current); scoreRef.current += 10; createExplosion(c.pos, '#facc15', 5, false); soundManager.playCoin(); setScore(Math.floor(scoreRef.current)); addCoins(c.value); onMissionUpdate('coins', c.value); onMissionUpdate('score', 10); }
      if (dist(c.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) c.dead = true;
    });
    coinsRef.current = coinsRef.current.filter(c => !c.dead);

    powerUpsRef.current.forEach(pu => {
      if (dist(pu.pos, p.pos) < pu.radius + p.radius) { pu.dead = true; activatePowerUp(pu.type); createExplosion(pu.pos, POWERUP_COLORS[pu.type], 15, false); soundManager.playPowerUp(); }
      if (dist(pu.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) pu.dead = true;
    });
    powerUpsRef.current = powerUpsRef.current.filter(pu => !pu.dead);

    if (!p.dead) {
        scoreRef.current += 0.2; scoreMissionAccumulatorRef.current += 0.2; setScore(Math.floor(scoreRef.current));
        if (frameCountRef.current % 60 === 0) {
            onMissionUpdate('time', 1);
            const pointsToAdd = Math.floor(scoreMissionAccumulatorRef.current);
            if (pointsToAdd > 0) { onMissionUpdate('score', pointsToAdd); scoreMissionAccumulatorRef.current -= pointsToAdd; }
        }
    }

    particlesRef.current.forEach(pt => { pt.pos = vecAdd(pt.pos, pt.vel); pt.vel = vecMult(pt.vel, 0.95); pt.life -= 0.03; });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);
  }, [setGameState, setScore, setCoinsCollected, addCoins, setActivePowerUps, skyState, onMissionUpdate, activePowerUps, gameMode]);

  const update = useCallback((time: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frameDuration = 1000 / 60; 
    let dt = time - lastTimeRef.current;
    if (dt > 100) dt = 100;
    lastTimeRef.current = time;
    accumulatorRef.current += dt;
    const isInGameOrMenu = gameState === GameState.PLAYING || gameState === GameState.MENU || gameState === GameState.PAUSED;
    const shouldRain = isInGameOrMenu && (skyState === SkyState.STORM || (skyState === SkyState.AUTO && stormIntensityRef.current > 0.1));
    if (shouldRain && !isRainPlayingRef.current) { soundManager.startRain(); isRainPlayingRef.current = true; } else if (!shouldRain && isRainPlayingRef.current) { soundManager.stopRain(); isRainPlayingRef.current = false; }
    while (accumulatorRef.current >= frameDuration) { if (gameState === GameState.PLAYING) fixedUpdate(width, height); else { gameTimeRef.current += 1/60; cloudsRef.current.forEach(c => c.x -= c.speed * 0.5); if (skyState === SkyState.STORM || (skyState === SkyState.AUTO && stormIntensityRef.current > 0)) { raindropsRef.current.forEach(d => { d.y += d.speed; d.x -= d.speed * 0.2; const screenY = d.y - cameraRef.current.y; if (screenY > height/2 + 1000) { d.y -= 2000; d.x = cameraRef.current.x + Math.random() * 2000 - 1000; } }); } if (skyState === SkyState.SNOW || (skyState === SkyState.AUTO && snowIntensityRef.current > 0)) { snowflakesRef.current.forEach(s => { s.y += s.speed * 0.5; s.x += Math.sin(gameTimeRef.current + s.drift) * 0.5; const screenY = s.y - cameraRef.current.y; if (screenY > height/2 + 500) { s.y -= 1500; s.x = cameraRef.current.x + Math.random() * 2000 - 1000; } }); } } accumulatorRef.current -= frameDuration; }
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);
    if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
        const drawTrail = (trail: Vector[], style: TrailStyle, lineWidth: number, currentPos?: Vector) => {
            if (trail.length === 0 && !currentPos) return;
            const color = style.color === 'rainbow' ? `hsl(${frameCountRef.current * 2 % 360}, 70%, 50%)` : (style.color || 'rgba(255,255,255,0.4)');
            ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = lineWidth; if (style.glow) { ctx.shadowBlur = 10; ctx.shadowColor = color; }
            if (style.type === 'bubbles') { trail.forEach((pos, i) => { if (i % 3 === 0) { const screen = worldToScreen(pos, width, height); ctx.beginPath(); ctx.arc(screen.x, screen.y, (i / trail.length) * lineWidth, 0, Math.PI*2); ctx.fill(); } }); } 
            else if (style.type === 'pixel') { trail.forEach((pos, i) => { if (i % 2 === 0) { const screen = worldToScreen(pos, width, height); ctx.fillRect(screen.x - (lineWidth*1.5)/2, screen.y - (lineWidth*1.5)/2, lineWidth*1.5, lineWidth*1.5, lineWidth*1.5); } }); } 
            else if (style.type === 'sparkle') { trail.forEach((pos, i) => { if (i % 2 === 0) { const screen = worldToScreen(pos, width, height); ctx.globalAlpha = i / trail.length; ctx.fillStyle = style.color || '#f472b6'; ctx.beginPath(); const size = (Math.random() * 0.5 + 0.5) * lineWidth * 0.6; ctx.arc(screen.x + (Math.random()-0.5)*6, screen.y + (Math.random()-0.5)*6, size, 0, Math.PI * 2); ctx.fill(); if (i % 10 === 0) { ctx.beginPath(); const shineSize = size * 2; ctx.moveTo(screen.x, screen.y - shineSize); ctx.lineTo(screen.x + shineSize, screen.y); ctx.lineTo(screen.x, screen.y + shineSize); ctx.lineTo(screen.x - shineSize, screen.y); ctx.fill(); } ctx.globalAlpha = 1.0; } }); } 
            else if (style.type === 'electric') { ctx.beginPath(); if (trail.length > 0) { const start = worldToScreen(trail[0], width, height); ctx.moveTo(start.x, start.y); } for (let i = 1; i < trail.length; i++) { const p = worldToScreen(trail[i], width, height); ctx.lineTo(p.x + Math.random()*6-3, p.y + Math.random()*6-3); } if (currentPos) { const end = worldToScreen(currentPos, width, height); ctx.lineTo(end.x, end.y); } ctx.stroke(); } 
            else { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); if (trail.length > 0) { const start = worldToScreen(trail[0], width, height); ctx.moveTo(start.x, start.y); } else if (currentPos) { const start = worldToScreen(currentPos, width, height); ctx.moveTo(start.x, start.y); } for (let i = 1; i < trail.length; i++) { const p = worldToScreen(trail[i], width, height); ctx.lineTo(p.x, p.y); } if (currentPos) { const end = worldToScreen(currentPos, width, height); ctx.lineTo(end.x, end.y); } ctx.stroke(); }
            ctx.shadowBlur = 0;
        };
        const p = playerRef.current;
        if (!p.dead) {
        const trailStyle = TRAILS.find(t => t.id === p.trailId) || TRAILS[0];
        drawTrail(p.trail, trailStyle, (p.speedBoostActive ? 14 : 10) * trailStyle.widthScale, { x: p.pos.x - Math.cos(p.angle) * 18, y: p.pos.y - Math.sin(p.angle) * 18 });
        const screenPos = worldToScreen(p.pos, width, height);
        ctx.save(); ctx.translate(screenPos.x, screenPos.y); ctx.rotate(p.angle + Math.PI / 2);
        const model = PLANE_MODELS.find(m => m.id === p.modelId) || PLANE_MODELS[0];
        const skin = PLANE_SKINS.find(s => s.id === p.skinId) || PLANE_SKINS[0];
        
        if (p.skinId === 'legend_gold') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FFD700';
        }

        ctx.fillStyle = skin.color; ctx.strokeStyle = skin.secondaryColor; ctx.lineWidth = 2; const path = new Path2D(model.path); ctx.fill(path); ctx.stroke(path);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 15); ctx.lineTo(5, 20); ctx.closePath(); ctx.fill();
        if (p.shieldActive) { ctx.beginPath(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3; ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(96, 165, 250, 0.2)'; ctx.fill(); }
        if (p.magnetActive) { ctx.beginPath(); ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.arc(0, 0, 40 + Math.sin(frameCountRef.current * 0.2) * 5, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
        }
        alliesRef.current.forEach(ally => { drawTrail(ally.trail, TRAILS[0], 4, { x: ally.pos.x - Math.cos(ally.angle) * 8, y: ally.pos.y - Math.sin(ally.angle) * 8 }); const screenPos = worldToScreen(ally.pos, width, height); ctx.save(); ctx.translate(screenPos.x, screenPos.y); ctx.rotate(ally.angle + Math.PI / 2); ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.fill(); ctx.restore(); });
        missilesRef.current.forEach(m => { drawTrail(m.trail, {id:'missile', name:'', price:0, rarity: Rarity.COMMON, color:'rgba(248, 113, 113, 0.6)', widthScale:1, glow:false, type:'line'}, 6, { x: m.pos.x - Math.cos(m.angle) * 10, y: m.pos.y - Math.sin(m.angle) * 10 }); const screenPos = worldToScreen(m.pos, width, height); ctx.save(); ctx.translate(screenPos.x, screenPos.y); ctx.rotate(m.angle + Math.PI / 2); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(7, 7); ctx.lineTo(0, 4); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.restore(); });
        coinsRef.current.forEach(c => { const screenPos = worldToScreen(c.pos, width, height); ctx.save(); ctx.translate(screenPos.x, screenPos.y); const scale = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1; ctx.scale(scale, scale); ctx.beginPath(); ctx.fillStyle = '#fbbf24'; ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1); ctx.restore(); });
        powerUpsRef.current.forEach(pu => { const screenPos = worldToScreen(pu.pos, width, height); ctx.save(); ctx.translate(screenPos.x, screenPos.y); ctx.beginPath(); ctx.fillStyle = POWERUP_COLORS[pu.type]; ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'white'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (pu.type === PowerUpType.SHIELD) { ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(6, -6, 6, 0); ctx.quadraticCurveTo(6, 6, 0, 8); ctx.quadraticCurveTo(-6, 6, -6, 0); ctx.quadraticCurveTo(-6, -6, 0, -6); ctx.stroke(); } else if (pu.type === PowerUpType.SPEED) { ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(-4, 0); ctx.lineTo(0, 0); ctx.lineTo(-2, 6); ctx.lineTo(4, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); } else if (pu.type === PowerUpType.MAGNET) { ctx.beginPath(); ctx.arc(0, -2, 5, Math.PI, 0); ctx.lineTo(5, 4); ctx.lineTo(2, 4); ctx.lineTo(2, -2); ctx.arc(0, -2, 2, 0, Math.PI, true); ctx.lineTo(-2, 4); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill(); } else if (pu.type === PowerUpType.SHOCKWAVE) { ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.stroke(); } else if (pu.type === PowerUpType.ALLIES) { ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-2, 5); ctx.lineTo(-8, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(8, 5); ctx.lineTo(2, 5); ctx.fill(); } ctx.restore(); });
        particlesRef.current.forEach(pt => { const screenPos = worldToScreen(pt.pos, width, height); ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(screenPos.x, screenPos.y, pt.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; });
        if (joystickRef.current && joystickRef.current.active) { const { origin, current } = joystickRef.current; ctx.beginPath(); ctx.arc(origin.x, origin.y, 40, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(current.x, current.y, 20, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fill(); }
    }
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, fixedUpdate, skyState]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let topColor = SKY_COLORS.DAY_TOP, bottomColor = SKY_COLORS.DAY_BOTTOM, starOpacity = 0;
    if (skyState === SkyState.AUTO) {
        const totalDuration = GAME_CONFIG.CYCLE_DURATION, time = cycleFrameRef.current % totalDuration, segmentDuration = totalDuration / 3;
        const getT = (pct: number) => pct < 0.7 ? 0 : (pct - 0.7) / 0.3;
        if (time < segmentDuration) { const t = getT(time / segmentDuration); topColor = lerpColor(SKY_COLORS.DAY_TOP, SKY_COLORS.SUNSET_TOP, t); bottomColor = lerpColor(SKY_COLORS.DAY_BOTTOM, SKY_COLORS.SUNSET_BOTTOM, t); } 
        else if (time < segmentDuration * 2) { const t = getT((time - segmentDuration) / segmentDuration); topColor = lerpColor(SKY_COLORS.SUNSET_TOP, SKY_COLORS.NIGHT_TOP, t); bottomColor = lerpColor(SKY_COLORS.SUNSET_BOTTOM, SKY_COLORS.NIGHT_BOTTOM, t); starOpacity = t; } 
        else { const t = getT((time - segmentDuration * 2) / segmentDuration); topColor = lerpColor(SKY_COLORS.NIGHT_TOP, SKY_COLORS.DAY_TOP, t); bottomColor = lerpColor(SKY_COLORS.NIGHT_BOTTOM, SKY_COLORS.DAY_BOTTOM, t); starOpacity = 1 - t; }
    } else if (skyState === SkyState.SUNSET) { topColor = SKY_COLORS.SUNSET_TOP; bottomColor = SKY_COLORS.SUNSET_BOTTOM; } 
    else if (skyState === SkyState.PURPLE_SUNSET) { topColor = SKY_COLORS.PURPLE_SUNSET_TOP; bottomColor = SKY_COLORS.PURPLE_SUNSET_BOTTOM; } 
    else if (skyState === SkyState.NIGHT) { topColor = SKY_COLORS.NIGHT_TOP; bottomColor = SKY_COLORS.NIGHT_BOTTOM; starOpacity = 1; } 
    else if (skyState === SkyState.STORM) { topColor = SKY_COLORS.STORM_TOP; bottomColor = SKY_COLORS.STORM_BOTTOM; } 
    else if (skyState === SkyState.SNOW) { topColor = SKY_COLORS.SNOW_TOP; bottomColor = SKY_COLORS.SNOW_BOTTOM; }
    if (skyState === SkyState.AUTO && stormIntensityRef.current > 0) { topColor = lerpColor(topColor, SKY_COLORS.STORM_TOP, stormIntensityRef.current); bottomColor = lerpColor(bottomColor, SKY_COLORS.STORM_BOTTOM, stormIntensityRef.current); }
    if (skyState === SkyState.AUTO && snowIntensityRef.current > 0) { topColor = lerpColor(topColor, SKY_COLORS.SNOW_TOP, snowIntensityRef.current); bottomColor = lerpColor(bottomColor, SKY_COLORS.SNOW_BOTTOM, snowIntensityRef.current); }
    const grad = ctx.createLinearGradient(0, 0, 0, height); grad.addColorStop(0, topColor); grad.addColorStop(1, bottomColor); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
    if (lightningAlphaRef.current > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${lightningAlphaRef.current})`; ctx.fillRect(0, 0, width, height); }
    if (starOpacity > 0 || (skyState === SkyState.AUTO && stormIntensityRef.current < 1 && snowIntensityRef.current < 1)) {
      const displayOpacity = Math.max(0, starOpacity - stormIntensityRef.current - snowIntensityRef.current);
      if (displayOpacity > 0) { ctx.fillStyle = 'white'; starsRef.current.forEach(star => { const offsetX = (star.x - cameraRef.current.x * star.speed) % 2000, offsetY = (star.y - cameraRef.current.y * star.speed) % 2000; let screenX = offsetX < 0 ? offsetX + 2000 : offsetX, screenY = offsetY < 0 ? offsetY + 2000 : offsetY; if (screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) { ctx.globalAlpha = displayOpacity * (0.5 + Math.sin(gameTimeRef.current * 5 + star.blinkOffset) * 0.5); ctx.beginPath(); ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; } }); }
    }
    cloudsRef.current.forEach(cloud => { const offsetX = (cloud.x - cameraRef.current.x * cloud.speed) % 2000, offsetY = (cloud.y - cameraRef.current.y * cloud.speed) % 2000; let screenX = offsetX < -200 ? offsetX + 2000 : offsetX, screenY = offsetY < -200 ? offsetY + 2000 : offsetY; if (screenX > -200 && screenX < width + 200 && screenY > -200 && screenY < height + 200) { let cloudAlpha = cloud.opacity, cloudColor = '255,255,255'; if (skyState === SkyState.STORM || (skyState === SkyState.AUTO && stormIntensityRef.current > 0)) { const intensity = (skyState === SkyState.STORM) ? 1 : stormIntensityRef.current; cloudColor = lerpColor('#ffffff', '#334155', intensity).match(/\d+, \d+, \d+/)?.[0] || '100, 116, 139'; cloudAlpha = cloud.opacity + (intensity * 0.4); } else if (skyState === SkyState.SNOW || (skyState === SkyState.AUTO && snowIntensityRef.current > 0)) { cloudAlpha = cloud.opacity + ((skyState === SkyState.SNOW ? 1 : snowIntensityRef.current) * 0.3); } else if (skyState === SkyState.PURPLE_SUNSET) { cloudColor = '244, 114, 182'; cloudAlpha = cloud.opacity + 0.1; } ctx.fillStyle = `rgba(${cloudColor}, ${cloudAlpha})`; ctx.beginPath(); ctx.arc(screenX, screenY, 60 * cloud.scale, 0, Math.PI * 2); ctx.arc(screenX + 40 * cloud.scale, screenY - 20 * cloud.scale, 70 * cloud.scale, 0, Math.PI * 2); ctx.arc(screenX + 90 * cloud.scale, screenY, 60 * cloud.scale, 0, Math.PI * 2); ctx.fill(); } });
    if (skyState === SkyState.STORM || (skyState === SkyState.AUTO && stormIntensityRef.current > 0)) { ctx.strokeStyle = `rgba(148, 163, 184, ${0.6 * ((skyState === SkyState.STORM) ? 1 : stormIntensityRef.current)})`; ctx.lineWidth = 1; ctx.beginPath(); raindropsRef.current.forEach(d => { const screenX = (d.x - cameraRef.current.x) % 2000 < 0 ? (d.x - cameraRef.current.x) % 2000 + 2000 : (d.x - cameraRef.current.x) % 2000, screenY = (d.y - cameraRef.current.y) % 2000 < 0 ? (d.y - cameraRef.current.y) % 2000 + 2000 : (d.y - cameraRef.current.y) % 2000; if (screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) { ctx.moveTo(screenX, screenY); ctx.lineTo(screenX - 5, screenY + d.length); } }); ctx.stroke(); }
    if (skyState === SkyState.SNOW || (skyState === SkyState.AUTO && snowIntensityRef.current > 0)) { ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * ((skyState === SkyState.SNOW) ? 1 : snowIntensityRef.current)})`; snowflakesRef.current.forEach(s => { const screenX = (s.x - cameraRef.current.x) % 2000 < 0 ? (s.x - cameraRef.current.x) % 2000 + 2000 : (s.x - cameraRef.current.x) % 2000, screenY = (s.y - cameraRef.current.y) % 2000 < 0 ? (s.y - cameraRef.current.y) % 2000 + 2000 : (s.y - cameraRef.current.y) % 2000; if (screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) { ctx.beginPath(); ctx.arc(screenX, screenY, s.size, 0, Math.PI * 2); ctx.fill(); } }); }
  };

  useEffect(() => {
    lastTimeRef.current = performance.now(); accumulatorRef.current = 0; requestRef.current = requestAnimationFrame(update);
    if (gameState === GameState.PLAYING && prevGameState.current !== GameState.PLAYING && prevGameState.current !== GameState.PAUSED && reviveSignal === 0) initGame();
    prevGameState.current = gameState;
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, initGame, update, reviveSignal]);

  const handlePointerDown = (e: React.PointerEvent) => { if (gameState !== GameState.PLAYING) return; joystickRef.current = { active: true, origin: { x: e.clientX, y: e.clientY }, current: { x: e.clientX, y: e.clientY } }; };
  const handlePointerMove = (e: React.PointerEvent) => { if (gameState === GameState.PLAYING && joystickRef.current?.active) joystickRef.current.current = { x: e.clientX, y: e.clientY }; };
  const handlePointerUp = () => { if (joystickRef.current) joystickRef.current.active = false; };

  return ( <canvas ref={canvasRef} className="absolute inset-0 touch-none" width={window.innerWidth} height={window.innerHeight} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} /> );
};

export const GameCanvas = React.memo(GameCanvasComponent);
