import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Missile, Particle, Coin, PowerUp, PowerUpType, Vector, Entity, Cloud, Star, SkyState, Ally, BoostType, TrailStyle } from '../types';
import { GAME_CONFIG, POWERUP_COLORS, SKINS, TRAILS, DEATH_EFFECTS, SKY_COLORS } from '../constants';
import { vecAdd, vecSub, vecMult, vecNorm, vecLen, dist, randomRange, lerp, soundManager } from '../utils';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setCoinsCollected: (coins: number) => void;
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
}

const GameCanvasComponent: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  setScore, 
  setCoinsCollected, 
  currentSkinId,
  currentTrailId,
  currentDeathEffectId,
  addCoins,
  setActivePowerUps,
  skyState,
  reviveSignal,
  onMissionUpdate,
  initialBoosts
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
  const cycleFrameRef = useRef(0);
  
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
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
    coinsCollectedRef.current = 0;
    frameCountRef.current = 0;
    gameTimeRef.current = 0;
    cycleFrameRef.current = 0;
    
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    
    // Only re-init background if starting fresh to keep randomness, 
    // but if coming from menu we might want to keep it? 
    // Let's re-init to ensure player starts in a clean zone.
    initBackground();

    setScore(0);
    setCoinsCollected(0);
    
    // Apply Initial Boosts
    const active = [];
    if (initialBoosts.includes(BoostType.SHIELD_START)) {
        playerRef.current.shieldActive = true;
        active.push(PowerUpType.SHIELD);
        setTimeout(() => {
             playerRef.current.shieldActive = false;
             setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.SHIELD));
        }, 10000);
    }
    if (initialBoosts.includes(BoostType.MAGNET_START)) {
        playerRef.current.magnetActive = true;
        active.push(PowerUpType.MAGNET);
        setTimeout(() => {
             playerRef.current.magnetActive = false;
             setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.MAGNET));
        }, 15000);
    }
    if (initialBoosts.includes(BoostType.SPEED_START)) {
        playerRef.current.speedBoostActive = true;
        active.push(PowerUpType.SPEED);
        setTimeout(() => {
             playerRef.current.speedBoostActive = false;
             setActivePowerUps(prev => prev.filter(p => p !== PowerUpType.SPEED));
        }, 5000);
    }
    setActivePowerUps(active);

  }, [currentSkinId, currentTrailId, currentDeathEffectId, setScore, setCoinsCollected, setActivePowerUps, initBackground, initialBoosts]);

  useEffect(() => {
    // Initial background setup on mount
    initBackground();
  }, [initBackground]);

  useEffect(() => {
    if (reviveSignal > 0 && playerRef.current.dead) {
      playerRef.current.dead = false;
      playerRef.current.shieldActive = true; 
      
      missilesRef.current = [];
      
      setTimeout(() => {
        playerRef.current.shieldActive = false;
        setActivePowerUps(prev => prev.filter(t => t !== PowerUpType.SHIELD));
      }, 3000);
      
      setActivePowerUps(prev => [...prev, PowerUpType.SHIELD]);
      prevGameState.current = GameState.PLAYING;
    }
  }, [reviveSignal, setActivePowerUps]);

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const worldToScreen = (pos: Vector, width: number, height: number): Vector => {
    return {
      x: pos.x - cameraRef.current.x + width / 2,
      y: pos.y - cameraRef.current.y + height / 2
    };
  };

  const createExplosion = (pos: Vector, color: string, count: number = 15) => {
    soundManager.playExplosion();
    const effectStyle = DEATH_EFFECTS.find(e => e.id === playerRef.current.deathEffectId);
    
    const isPlayerDeath = color === '#f472b6'; 
    const particleCount = isPlayerDeath && effectStyle ? effectStyle.particleCount : count;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const pColor = (isPlayerDeath && effectStyle && effectStyle.particleColor === 'random') 
        ? `hsl(${Math.random() * 360}, 100%, 50%)`
        : (isPlayerDeath && effectStyle?.particleColor ? effectStyle.particleColor : color);

      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1.0,
        maxLife: 1.0,
        color: pColor,
        size: Math.random() * 5 + 2
      });
    }
  };

  const spawnShockwave = (pos: Vector) => {
    soundManager.playShockwave();
    for(let i=0; i<36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        vel: { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 },
        life: 0.8,
        maxLife: 0.8,
        color: '#60a5fa', 
        size: 5
      });
    }
    if (missilesRef.current.length > 0) {
        onMissionUpdate('missiles', missilesRef.current.length);
    }
    missilesRef.current.forEach(m => createExplosion(m.pos, '#ef4444', 5));
    missilesRef.current = [];
  };

  const spawnAllies = (pos: Vector) => {
    for(let i=0; i<3; i++) {
        alliesRef.current.push({
            id: i.toString(), 
            pos: vecAdd(pos, {x: Math.random()*50-25, y: Math.random()*50-25}),
            vel: {x: 0, y: 0},
            angle: Math.random() * Math.PI * 2,
            radius: 8,
            dead: false,
            trail: [],
            targetId: null,
            lifeTime: 600, 
            orbitOffset: (i * (Math.PI * 2)) / 3 
        });
    }
  };

  const getRandomSpawnPos = (width: number, height: number): Vector => {
    const angle = Math.random() * Math.PI * 2;
    const screenDiag = Math.sqrt(width * width + height * height) / 2;
    const distance = screenDiag + GAME_CONFIG.SPAWN_DISTANCE_OFFSET;
    
    return {
      x: cameraRef.current.x + Math.cos(angle) * distance,
      y: cameraRef.current.y + Math.sin(angle) * distance
    };
  };

  const spawnMissile = (width: number, height: number, difficultyMultiplier: number) => {
    const startPos = getRandomSpawnPos(width, height);
    missilesRef.current.push({
      id: Math.random().toString(),
      pos: startPos,
      vel: { x: 0, y: 0 },
      angle: 0,
      radius: GAME_CONFIG.MISSILE_RADIUS,
      dead: false,
      turnRate: GAME_CONFIG.MISSILE_TURN_RATE * difficultyMultiplier,
      speed: GAME_CONFIG.MISSILE_BASE_SPEED * difficultyMultiplier,
      wobbleOffset: Math.random() * 100,
      trail: []
    });
  };

  const spawnCoin = (width: number, height: number) => {
    coinsRef.current.push({
      id: Math.random().toString(),
      pos: getRandomSpawnPos(width, height),
      vel: { x: 0, y: 0 },
      angle: 0,
      radius: 12,
      dead: false,
      value: 10,
      magnetized: false,
      trail: []
    });
  };

  const spawnPowerUp = (width: number, height: number) => {
    const types = [PowerUpType.SHIELD, PowerUpType.SPEED, PowerUpType.MAGNET, PowerUpType.SHOCKWAVE, PowerUpType.ALLIES];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUpsRef.current.push({
      id: Math.random().toString(),
      pos: getRandomSpawnPos(width, height),
      vel: { x: 0, y: 0 },
      angle: 0,
      radius: 14,
      dead: false,
      type: type,
      trail: []
    });
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
    } else if (type === PowerUpType.SHOCKWAVE) {
      spawnShockwave(p.pos);
      return; 
    } else if (type === PowerUpType.ALLIES) {
      spawnAllies(p.pos);
    }
    setActivePowerUps(prev => [...prev.filter(t => t !== type), type]);
  };

  const updateTrail = (entity: Entity, currentPos: Vector, freq: number = 2) => {
    if (frameCountRef.current % freq === 0) {
      entity.trail.push({ ...currentPos });
      if (entity.trail.length > GAME_CONFIG.TRAIL_LENGTH) {
        entity.trail.shift();
      }
    }
  };

  const fixedUpdate = useCallback((width: number, height: number) => {
    frameCountRef.current++;
    gameTimeRef.current += 1/60;
    
    if (skyState === SkyState.AUTO) {
        cycleFrameRef.current++;
    }

    const difficultyMultiplier = 1 + Math.min(scoreRef.current / 3000, 1.2);

    if (frameCountRef.current % Math.floor(GAME_CONFIG.MISSILE_SPAWN_RATE / difficultyMultiplier) === 0) {
      spawnMissile(width, height, difficultyMultiplier);
    }
    if (frameCountRef.current % GAME_CONFIG.COIN_SPAWN_RATE === 0 && coinsRef.current.length < 10) {
      spawnCoin(width, height);
    }
    if (frameCountRef.current % GAME_CONFIG.POWERUP_SPAWN_RATE === 0 && powerUpsRef.current.length < 3) {
      spawnPowerUp(width, height);
    }

    const p = playerRef.current;
    
    if (joystickRef.current && joystickRef.current.active) {
      const { origin, current } = joystickRef.current;
      const diff = vecSub(current, origin);
      const len = vecLen(diff);
      
      if (len > 10) { 
        const targetAngle = Math.atan2(diff.y, diff.x);
        let angleDiff = targetAngle - p.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        p.angle += Math.max(-GAME_CONFIG.PLAYER_TURN_SPEED, Math.min(GAME_CONFIG.PLAYER_TURN_SPEED, angleDiff));
      }
    }

    const currentSpeed = p.speedBoostActive ? GAME_CONFIG.PLAYER_BOOST_SPEED : GAME_CONFIG.PLAYER_SPEED;
    const moveVel = { x: Math.cos(p.angle) * currentSpeed, y: Math.sin(p.angle) * currentSpeed };
    p.pos = vecAdd(p.pos, moveVel);

    const cameraTarget = p.pos;
    cameraRef.current.x = lerp(cameraRef.current.x, cameraTarget.x, 0.1);
    cameraRef.current.y = lerp(cameraRef.current.y, cameraTarget.y, 0.1);

    const playerTailOffset = 18;
    const playerTailPos = {
      x: p.pos.x - Math.cos(p.angle) * playerTailOffset,
      y: p.pos.y - Math.sin(p.angle) * playerTailOffset
    };
    updateTrail(p, playerTailPos, 2);

    // Allies Update
    alliesRef.current.forEach(ally => {
        let nearestDist = 9999;
        let target: Missile | null = null;
        missilesRef.current.forEach(m => {
            const d = dist(ally.pos, m.pos);
            if (d < nearestDist) {
                nearestDist = d;
                target = m;
            }
        });

        const allySpeed = 7;
        if (target && nearestDist < 500) {
            const toTarget = vecSub(target.pos, ally.pos);
            const angleToTarget = Math.atan2(toTarget.y, toTarget.x);
            ally.angle = angleToTarget;
            
            if (nearestDist < 20) {
                target.dead = true;
                ally.dead = true; 
                createExplosion(target.pos, '#22d3ee', 10);
                onMissionUpdate('missiles', 1);
            }
        } else {
            const orbitDist = 60;
            const orbitSpeed = 0.05;
            const time = frameCountRef.current * orbitSpeed + (ally.orbitOffset || 0);
            
            const targetPos = {
                x: p.pos.x + Math.cos(time) * orbitDist,
                y: p.pos.y + Math.sin(time) * orbitDist
            };
            const toTarget = vecSub(targetPos, ally.pos);
            ally.angle = Math.atan2(toTarget.y, toTarget.x);
        }

        const vel = { x: Math.cos(ally.angle) * allySpeed, y: Math.sin(ally.angle) * allySpeed };
        ally.pos = vecAdd(ally.pos, vel);
        ally.lifeTime--;
        if (ally.lifeTime <= 0) ally.dead = true;
        
        const allyTailPos = {
            x: ally.pos.x - Math.cos(ally.angle) * 8,
            y: ally.pos.y - Math.sin(ally.angle) * 8
        };
        updateTrail(ally, allyTailPos, 4);
    });
    alliesRef.current = alliesRef.current.filter(a => !a.dead);

    missilesRef.current.forEach(m => {
      const toPlayer = vecSub(p.pos, m.pos);
      const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
      
      let angleDiff = angleToPlayer - m.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      m.angle += Math.max(-m.turnRate, Math.min(m.turnRate, angleDiff));
      const velocity = { x: Math.cos(m.angle) * m.speed, y: Math.sin(m.angle) * m.speed };
      m.pos = vecAdd(m.pos, velocity);

      const missileTailOffset = 10; 
      const missileTailPos = {
        x: m.pos.x - Math.cos(m.angle) * missileTailOffset,
        y: m.pos.y - Math.sin(m.angle) * missileTailOffset
      };
      updateTrail(m, missileTailPos, 2);

      if (dist(m.pos, p.pos) < m.radius + p.radius - 5 && !p.dead) {
        if (p.shieldActive) {
          m.dead = true;
          createExplosion(m.pos, '#60a5fa', 10);
          scoreRef.current += 50;
        } else {
          p.dead = true;
          createExplosion(p.pos, '#f472b6', 40);
          soundManager.playGameOver();
          setGameState(GameState.GAMEOVER);
        }
      }

      missilesRef.current.forEach(otherM => {
        if (m === otherM || otherM.dead) return;
        if (dist(m.pos, otherM.pos) < m.radius + otherM.radius) {
          m.dead = true;
          otherM.dead = true;
          createExplosion(m.pos, '#facc15', 20);
          scoreRef.current += 100;
          setScore(Math.floor(scoreRef.current));
          onMissionUpdate('missiles', 2);
        }
      });

      if (dist(m.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) m.dead = true;
    });
    missilesRef.current = missilesRef.current.filter(m => !m.dead);

    coinsRef.current.forEach(c => {
      if (p.magnetActive && dist(c.pos, p.pos) < 350) c.magnetized = true;
      if (c.magnetized) {
        const dir = vecNorm(vecSub(p.pos, c.pos));
        c.pos = vecAdd(c.pos, vecMult(dir, 14));
      }
      if (dist(c.pos, p.pos) < c.radius + p.radius) {
        c.dead = true;
        coinsCollectedRef.current += c.value;
        setCoinsCollected(coinsCollectedRef.current);
        scoreRef.current += 10;
        createExplosion(c.pos, '#facc15', 5);
        soundManager.playCoin();
        setScore(Math.floor(scoreRef.current));
        addCoins(c.value);
        onMissionUpdate('coins', c.value);
      }
      if (dist(c.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) c.dead = true;
    });
    coinsRef.current = coinsRef.current.filter(c => !c.dead);

    powerUpsRef.current.forEach(pu => {
      if (dist(pu.pos, p.pos) < pu.radius + p.radius) {
        pu.dead = true;
        activatePowerUp(pu.type);
        createExplosion(pu.pos, POWERUP_COLORS[pu.type], 15);
        soundManager.playPowerUp();
      }
      if (dist(pu.pos, p.pos) > GAME_CONFIG.DESPAWN_DISTANCE) pu.dead = true;
    });
    powerUpsRef.current = powerUpsRef.current.filter(pu => !pu.dead);

    if (!p.dead) {
        scoreRef.current += 0.2;
        setScore(Math.floor(scoreRef.current));
        if (frameCountRef.current % 60 === 0) {
            onMissionUpdate('time', 1);
        }
    }

    particlesRef.current.forEach(pt => {
      pt.pos = vecAdd(pt.pos, pt.vel);
      pt.vel = vecMult(pt.vel, 0.95);
      pt.life -= 0.03;
    });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);
  }, [setGameState, setScore, setCoinsCollected, addCoins, setActivePowerUps, skyState, onMissionUpdate]);

  const update = useCallback((time: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Delta Time Logic for 60FPS lock
    const frameDuration = 1000 / 60; 
    let dt = time - lastTimeRef.current;
    if (dt > 100) dt = 100; // Cap dt to prevent spiral of death if tab was inactive
    lastTimeRef.current = time;
    accumulatorRef.current += dt;

    // Fixed Update Loop (Logic)
    while (accumulatorRef.current >= frameDuration) {
        if (gameState === GameState.PLAYING) {
            fixedUpdate(width, height);
        } else {
            // Animate background elements in Menu/Pause
            gameTimeRef.current += 1/60;
            cloudsRef.current.forEach(c => {
                 c.x -= c.speed * 0.5; // Simulate gentle wind
            });
        }
        accumulatorRef.current -= frameDuration;
    }

    // Drawing Loop
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);

    if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
        const drawTrail = (trail: Vector[], style: TrailStyle, lineWidth: number, currentPos?: Vector) => {
            if (trail.length === 0 && !currentPos) return;
            const color = style.color === 'rainbow' ? `hsl(${frameCountRef.current * 2 % 360}, 70%, 50%)` : (style.color || 'rgba(255,255,255,0.4)');
            
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            if (style.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
            }

            if (style.type === 'bubbles') {
                trail.forEach((pos, i) => {
                    if (i % 3 === 0) {
                        const size = (i / trail.length) * lineWidth;
                        const screen = worldToScreen(pos, width, height);
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, size, 0, Math.PI*2);
                        ctx.fill();
                    }
                });
            } else if (style.type === 'pixel') {
                trail.forEach((pos, i) => {
                    if (i % 2 === 0) {
                        const size = lineWidth * 1.5;
                        const screen = worldToScreen(pos, width, height);
                        ctx.fillRect(screen.x - size/2, screen.y - size/2, size, size);
                    }
                });
            } else if (style.type === 'sparkle') {
                trail.forEach((pos, i) => {
                    if (i % 4 === 0) {
                        const screen = worldToScreen(pos, width, height);
                        const size = lineWidth;
                        ctx.beginPath();
                        ctx.moveTo(screen.x - size, screen.y);
                        ctx.lineTo(screen.x + size, screen.y);
                        ctx.moveTo(screen.x, screen.y - size);
                        ctx.lineTo(screen.x, screen.y + size);
                        ctx.stroke();
                    }
                });
            } else if (style.type === 'electric') {
                ctx.beginPath();
                if (trail.length > 0) {
                    const start = worldToScreen(trail[0], width, height);
                    ctx.moveTo(start.x, start.y);
                }
                for (let i = 1; i < trail.length; i++) {
                    const p = worldToScreen(trail[i], width, height);
                    const jitter = Math.random() * 4 - 2;
                    ctx.lineTo(p.x + jitter, p.y + jitter);
                }
                if (currentPos) {
                    const end = worldToScreen(currentPos, width, height);
                    ctx.lineTo(end.x, end.y);
                }
                ctx.stroke();
            } else {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                if (trail.length > 0) {
                    const start = worldToScreen(trail[0], width, height);
                    ctx.moveTo(start.x, start.y);
                } else if (currentPos) {
                    const start = worldToScreen(currentPos, width, height);
                    ctx.moveTo(start.x, start.y);
                }
                for (let i = 1; i < trail.length; i++) {
                    const p = worldToScreen(trail[i], width, height);
                    ctx.lineTo(p.x, p.y);
                }
                if (currentPos) {
                    const end = worldToScreen(currentPos, width, height);
                    ctx.lineTo(end.x, end.y);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        };

        const p = playerRef.current;
        if (!p.dead) {
        const playerTailOffset = 18;
        const playerTailPos = {
            x: p.pos.x - Math.cos(p.angle) * playerTailOffset,
            y: p.pos.y - Math.sin(p.angle) * playerTailOffset
        };

        const trailStyle = TRAILS.find(t => t.id === p.trailId) || TRAILS[0];
        const isBoosting = p.speedBoostActive;
        const trailWidth = (isBoosting ? 14 : 10) * trailStyle.widthScale;

        drawTrail(p.trail, trailStyle, trailWidth, playerTailPos);
        
        const screenPos = worldToScreen(p.pos, width, height);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(p.angle + Math.PI / 2);

        const skin = SKINS.find(s => s.id === p.skinId) || SKINS[0];
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 20);
        ctx.lineTo(0, 15);
        ctx.lineTo(-15, 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = skin.color;
        ctx.strokeStyle = skin.secondaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 20);
        ctx.lineTo(0, 15);
        ctx.lineTo(-15, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(0, 15);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fill();

        if (p.shieldActive) {
            ctx.beginPath();
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 3;
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
            ctx.fill();
        }
        if (p.magnetActive) {
            ctx.beginPath();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.arc(0, 0, 40 + Math.sin(frameCountRef.current * 0.2) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        }

        alliesRef.current.forEach(ally => {
            const allyTailPos = {
                x: ally.pos.x - Math.cos(ally.angle) * 8,
                y: ally.pos.y - Math.sin(ally.angle) * 8
            };
            drawTrail(ally.trail, TRAILS[0], 4, allyTailPos); 
            
            const screenPos = worldToScreen(ally.pos, width, height);
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(ally.angle + Math.PI / 2);
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(6, 6);
            ctx.lineTo(0, 3);
            ctx.lineTo(-6, 6);
            ctx.fill();
            ctx.restore();
        });

        missilesRef.current.forEach(m => {
        const missileTailOffset = 10; 
        const missileTailPos = {
            x: m.pos.x - Math.cos(m.angle) * missileTailOffset,
            y: m.pos.y - Math.sin(m.angle) * missileTailOffset
        };
        drawTrail(m.trail, {id:'missile', name:'', price:0, color:'rgba(248, 113, 113, 0.6)', widthScale:1, glow:false, type:'line'}, 6, missileTailPos);
        
        const screenPos = worldToScreen(m.pos, width, height);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(m.angle + Math.PI / 2);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(7, 7);
        ctx.lineTo(0, 4);
        ctx.lineTo(-7, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        });

        coinsRef.current.forEach(c => {
        const screenPos = worldToScreen(c.pos, width, height);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        const scale = 1 + Math.sin(frameCountRef.current * 0.1) * 0.1;
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.fillStyle = '#fbbf24';
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        ctx.restore();
        });

        // Vector PowerUps
        powerUpsRef.current.forEach(pu => {
        const screenPos = worldToScreen(pu.pos, width, height);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        
        ctx.beginPath();
        ctx.fillStyle = POWERUP_COLORS[pu.type];
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (pu.type === PowerUpType.SHIELD) {
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.quadraticCurveTo(6, -6, 6, 0);
            ctx.quadraticCurveTo(6, 6, 0, 8);
            ctx.quadraticCurveTo(-6, 6, -6, 0);
            ctx.quadraticCurveTo(-6, -6, 0, -6);
            ctx.stroke();
        } else if (pu.type === PowerUpType.SPEED) {
            ctx.beginPath();
            ctx.moveTo(2, -6);
            ctx.lineTo(-4, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2, 6);
            ctx.lineTo(4, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        } else if (pu.type === PowerUpType.MAGNET) {
            ctx.beginPath();
            ctx.arc(0, -2, 5, Math.PI, 0);
            ctx.lineTo(5, 4);
            ctx.lineTo(2, 4);
            ctx.lineTo(2, -2);
            ctx.arc(0, -2, 2, 0, Math.PI, true);
            ctx.lineTo(-2, 4);
            ctx.lineTo(-5, 4);
            ctx.closePath();
            ctx.fill();
        } else if (pu.type === PowerUpType.SHOCKWAVE) {
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI*2);
            ctx.stroke();
        } else if (pu.type === PowerUpType.ALLIES) {
            ctx.beginPath();
            ctx.moveTo(0, -5); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-5, 0); ctx.lineTo(-2, 5); ctx.lineTo(-8, 5); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(5, 0); ctx.lineTo(8, 5); ctx.lineTo(2, 5); ctx.fill();
        }
        
        ctx.restore();
        });

        particlesRef.current.forEach(pt => {
        const screenPos = worldToScreen(pt.pos, width, height);
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        });

        if (joystickRef.current && joystickRef.current.active) {
        const { origin, current } = joystickRef.current;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        }
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, fixedUpdate]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let topColor = SKY_COLORS.DAY_TOP;
    let bottomColor = SKY_COLORS.DAY_BOTTOM;
    let isNight = false;

    let currentPhase = skyState;
    if (skyState === SkyState.AUTO) {
        const cycle = cycleFrameRef.current % GAME_CONFIG.CYCLE_DURATION;
        const third = GAME_CONFIG.CYCLE_DURATION / 3;
        if (cycle < third) currentPhase = SkyState.DAY;
        else if (cycle < third * 2) currentPhase = SkyState.SUNSET;
        else currentPhase = SkyState.NIGHT;
    }

    if (currentPhase === SkyState.SUNSET) {
        topColor = SKY_COLORS.SUNSET_TOP;
        bottomColor = SKY_COLORS.SUNSET_BOTTOM;
    } else if (currentPhase === SkyState.NIGHT) {
        topColor = SKY_COLORS.NIGHT_TOP;
        bottomColor = SKY_COLORS.NIGHT_BOTTOM;
        isNight = true;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (isNight) {
      ctx.fillStyle = 'white';
      starsRef.current.forEach(star => {
        const offsetX = (star.x - cameraRef.current.x * star.speed) % 2000;
        const offsetY = (star.y - cameraRef.current.y * star.speed) % 2000;
        let screenX = offsetX < 0 ? offsetX + 2000 : offsetX;
        let screenY = offsetY < 0 ? offsetY + 2000 : offsetY;

        if (screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) {
            const opacity = 0.5 + Math.sin(gameTimeRef.current * 5 + star.blinkOffset) * 0.5;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
      });
    }

    cloudsRef.current.forEach(cloud => {
        const offsetX = (cloud.x - cameraRef.current.x * cloud.speed) % 2000;
        const offsetY = (cloud.y - cameraRef.current.y * cloud.speed) % 2000;
        let screenX = offsetX < -200 ? offsetX + 2000 : offsetX;
        let screenY = offsetY < -200 ? offsetY + 2000 : offsetY;

        if (screenX > -200 && screenX < width + 200 && screenY > -200 && screenY < height + 200) {
            ctx.fillStyle = isNight ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 60 * cloud.scale, 0, Math.PI * 2);
            ctx.arc(screenX + 40 * cloud.scale, screenY - 20 * cloud.scale, 70 * cloud.scale, 0, Math.PI * 2);
            ctx.arc(screenX + 90 * cloud.scale, screenY, 60 * cloud.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    });
  };

  useEffect(() => {
    // Start loop immediately
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    requestRef.current = requestAnimationFrame(update);
    
    if (gameState === GameState.PLAYING && prevGameState.current !== GameState.PLAYING && prevGameState.current !== GameState.PAUSED && reviveSignal === 0) {
        initGame();
    }
    
    prevGameState.current = gameState;
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, initGame, update, reviveSignal]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING) return;
    joystickRef.current = {
      active: true,
      origin: { x: e.clientX, y: e.clientY },
      current: { x: e.clientX, y: e.clientY }
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING || !joystickRef.current?.active) return;
    joystickRef.current.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    if (joystickRef.current) joystickRef.current.active = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 touch-none"
      width={window.innerWidth}
      height={window.innerHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export const GameCanvas = React.memo(GameCanvasComponent);