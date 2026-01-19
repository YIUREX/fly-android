
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Shop } from './components/Shop';
import { GameState, PowerUpType, SkyState, Mission, Achievement, GameStats, BoostType, LootResult, LeaderboardEntry, GameMode } from './types';
import { ACHIEVEMENTS_LIST, MUSIC_PLAYLIST, LOOT_BOX_PRICE, MOCK_LEADERBOARD, PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS } from './constants';
import { generateDailyMissions, soundManager, getLootItem } from './utils';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(() => (localStorage.getItem('fly_cur_mode') as GameMode) || GameMode.NORMAL);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [revivesThisRun, setRevivesThisRun] = useState(0);

  // --- AUDIO SETTINGS ---
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('fly_vol_music');
    const val = saved ? parseFloat(saved) : 0.5;
    return isFinite(val) ? val : 0.5;
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('fly_vol_sfx');
    const val = saved ? parseFloat(saved) : 0.3;
    return isFinite(val) ? val : 0.3;
  });

  // --- MUSIC ENGINE ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicCurrentTrackIndex, setMusicCurrentTrackIndex] = useState(() => Math.floor(Math.random() * MUSIC_PLAYLIST.length));
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicIsShuffle, setMusicIsShuffle] = useState(true); // Default to shuffle
  const [musicIsLoop, setMusicIsLoop] = useState(false);

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = Math.max(0, Math.min(1, musicVolume));
      }
      localStorage.setItem('fly_vol_music', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
      soundManager.setVolume(Math.max(0, Math.min(1, sfxVolume)));
      localStorage.setItem('fly_vol_sfx', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const track = MUSIC_PLAYLIST[musicCurrentTrackIndex];
      if (!track) return;

      const currentSrc = audio.getAttribute('src');
      if (currentSrc !== track.src && audio.src !== track.src) {
          audio.src = track.src;
          if (musicIsPlaying) {
              const playPromise = audio.play();
              if (playPromise !== undefined) playPromise.catch(() => {});
          }
      }

      if (musicIsPlaying && audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) playPromise.catch(() => {});
      } else if (!musicIsPlaying && !audio.paused) {
          audio.pause();
      }
  }, [musicCurrentTrackIndex, musicIsPlaying]); 

  const handleAudioEnded = () => {
      if (musicIsLoop) {
          if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
          }
      } else if (musicIsShuffle) {
          let nextIndex;
          do {
              nextIndex = Math.floor(Math.random() * MUSIC_PLAYLIST.length);
          } while (nextIndex === musicCurrentTrackIndex && MUSIC_PLAYLIST.length > 1);
          setMusicCurrentTrackIndex(nextIndex);
      } else {
          setMusicCurrentTrackIndex(prev => (prev + 1) % MUSIC_PLAYLIST.length);
      }
  };

  const handleMusicPlayPause = () => setMusicIsPlaying(prev => !prev);
  const handleMusicNext = () => {
      if (musicIsShuffle) {
          let nextIndex;
          do {
              nextIndex = Math.floor(Math.random() * MUSIC_PLAYLIST.length);
          } while (nextIndex === musicCurrentTrackIndex && MUSIC_PLAYLIST.length > 1);
          setMusicCurrentTrackIndex(nextIndex);
      } else {
          setMusicCurrentTrackIndex(prev => (prev + 1) % MUSIC_PLAYLIST.length);
      }
      setMusicIsPlaying(true);
  };
  const handleMusicPrev = () => {
      setMusicCurrentTrackIndex(prev => (prev - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length);
      setMusicIsPlaying(true);
  };
  const handleMusicSelect = (index: number) => {
      setMusicCurrentTrackIndex(index);
      setMusicIsPlaying(true);
  };
  const handleMusicToggleShuffle = () => setMusicIsShuffle(prev => !prev);
  const handleMusicToggleLoop = () => setMusicIsLoop(prev => !prev);

  // --- PERSISTENCE ---
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('fly_coins') || '0') || 0; } catch { return 0; }
  });
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fly_redeemed_codes') || '[]'); } catch { return []; }
  });
  const [ownedModels, setOwnedModels] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fly_models') || '["default"]'); } catch { return ['default']; }
  });
  const [ownedSkins, setOwnedSkins] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fly_skins') || '["default"]'); } catch { return ['default']; }
  });
  const [ownedTrails, setOwnedTrails] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fly_trails') || '["default"]'); } catch { return ['default']; }
  });
  const [ownedEffects, setOwnedEffects] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fly_effects') || '["default"]'); } catch { return ['default']; }
  });
  const [boostInventory, setBoostInventory] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('fly_boosts') || '{}'); } catch { return {}; }
  });

  const [currentModelId, setCurrentModelId] = useState<string>(() => localStorage.getItem('fly_cur_model') || 'default');
  const [currentSkinId, setCurrentSkinId] = useState<string>(() => localStorage.getItem('fly_cur_skin') || 'default');
  const [currentTrailId, setCurrentTrailId] = useState<string>(() => localStorage.getItem('fly_cur_trail') || 'default');
  const [currentEffectId, setCurrentEffectId] = useState<string>(() => localStorage.getItem('fly_cur_effect') || 'default');

  const [activeBoosts, setActiveBoosts] = useState<BoostType[]>([]); 

  // --- HIGH SCORES PER MODE ---
  const [highScores, setHighScores] = useState<Record<GameMode, number>>(() => {
      const normal = parseInt(localStorage.getItem('fly_highscore_NORMAL') || localStorage.getItem('fly_highscore') || '0') || 0;
      const comp = parseInt(localStorage.getItem('fly_highscore_COMPETITION') || '0') || 0;
      const chill = parseInt(localStorage.getItem('fly_highscore_CHILL') || '0') || 0;
      return { [GameMode.NORMAL]: normal, [GameMode.COMPETITION]: comp, [GameMode.CHILL]: chill };
  });

  const [skyState, setSkyState] = useState<SkyState>(() => {
    const saved = localStorage.getItem('fly_skystate');
    return (saved as SkyState) || SkyState.DAY;
  });

  const [missions, setMissions] = useState<Mission[]>([]);
  const [streak, setStreak] = useState<number>(() => parseInt(localStorage.getItem('fly_streak') || '0') || 0);
  
  const [stats, setStats] = useState<GameStats>(() => {
      try { return JSON.parse(localStorage.getItem('fly_stats') || JSON.stringify({ totalScore: 0, totalCoins: 0, totalTime: 0, totalMissilesDodged: 0, maxScore: 0 })); }
      catch { return { totalScore: 0, totalCoins: 0, totalTime: 0, totalMissilesDodged: 0, maxScore: 0 }; }
  });
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);

  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('fly_player_name') || 'Piloto');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
        const saved = localStorage.getItem('fly_leaderboard');
        return saved ? JSON.parse(saved) : []; 
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('fly_coins', totalCoins.toString()); }, [totalCoins]);
  useEffect(() => { localStorage.setItem('fly_redeemed_codes', JSON.stringify(redeemedCodes)); }, [redeemedCodes]);
  useEffect(() => { localStorage.setItem('fly_models', JSON.stringify(ownedModels)); }, [ownedModels]);
  useEffect(() => { localStorage.setItem('fly_skins', JSON.stringify(ownedSkins)); }, [ownedSkins]);
  useEffect(() => { localStorage.setItem('fly_trails', JSON.stringify(ownedTrails)); }, [ownedTrails]);
  useEffect(() => { localStorage.setItem('fly_effects', JSON.stringify(ownedEffects)); }, [ownedEffects]);
  useEffect(() => { localStorage.setItem('fly_boosts', JSON.stringify(boostInventory)); }, [boostInventory]);
  useEffect(() => { localStorage.setItem('fly_cur_model', currentModelId); }, [currentModelId]);
  useEffect(() => { localStorage.setItem('fly_cur_skin', currentSkinId); }, [currentSkinId]);
  useEffect(() => { localStorage.setItem('fly_cur_trail', currentTrailId); }, [currentTrailId]);
  useEffect(() => { localStorage.setItem('fly_cur_effect', currentEffectId); }, [currentEffectId]);
  useEffect(() => { localStorage.setItem('fly_skystate', skyState); }, [skyState]);
  useEffect(() => { localStorage.setItem('fly_streak', streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem('fly_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('fly_player_name', playerName); }, [playerName]);
  useEffect(() => { localStorage.setItem('fly_cur_mode', gameMode); }, [gameMode]);

  useEffect(() => {
    const lastDate = localStorage.getItem('fly_mission_date');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        const newMissions = generateDailyMissions();
        setMissions(newMissions);
        localStorage.setItem('fly_mission_date', today);
        localStorage.setItem('fly_missions', JSON.stringify(newMissions));
    } else {
        try { setMissions(JSON.parse(localStorage.getItem('fly_missions') || '[]')); } catch { setMissions(generateDailyMissions()); }
    }
    const unlockedIds = JSON.parse(localStorage.getItem('fly_achievements_unlocked') || '[]');
    setAchievements(prev => prev.map(a => ({...a, unlocked: unlockedIds.includes(a.id)})));
  }, []);

  const unlockAchievement = (id: string, reward: number) => {
      const unlockedIds = JSON.parse(localStorage.getItem('fly_achievements_unlocked') || '[]');
      if (!unlockedIds.includes(id)) {
          unlockedIds.push(id);
          localStorage.setItem('fly_achievements_unlocked', JSON.stringify(unlockedIds));
          setAchievements(prev => prev.map(a => a.id === id ? {...a, unlocked: true} : a));
          setTotalCoins(prev => prev + reward);
          
          // Secret Legend Unlock logic
          if (id === 'minecraft_advancement') {
              if (!ownedSkins.includes('legend_gold')) setOwnedSkins(prev => [...prev, 'legend_gold']);
              if (!ownedTrails.includes('gold_glitter')) setOwnedTrails(prev => [...prev, 'gold_glitter']);
          }
      }
  };

  useEffect(() => {
      const hasShield = activePowerUps.includes(PowerUpType.SHIELD);
      const hasSpeed = activePowerUps.includes(PowerUpType.SPEED);
      const hasAllies = activePowerUps.includes(PowerUpType.ALLIES);
      if (hasShield && hasSpeed && hasAllies) unlockAchievement('hero_complex', 1000);
  }, [activePowerUps]);

  const handleMissionUpdate = useCallback((type: string, amount: number) => {
      setMissions(prev => {
          let rewardToAdd = 0;
          const updated = prev.map(m => {
              if (!m.completed && m.type === type) {
                  const newCurrent = m.current + amount;
                  if (newCurrent >= m.target) {
                      rewardToAdd += m.reward;
                      return { ...m, current: newCurrent, completed: true };
                  }
                  return { ...m, current: newCurrent };
              }
              return m;
          });
          if (rewardToAdd > 0) setTotalCoins(c => c + rewardToAdd);
          localStorage.setItem('fly_missions', JSON.stringify(updated));
          return updated;
      });
      setStats(prev => {
          const newStats = { ...prev };
          if (type === 'score') newStats.totalScore += amount; 
          if (type === 'coins') newStats.totalCoins += amount;
          if (type === 'missiles') newStats.totalMissilesDodged += amount;
          return newStats;
      });
  }, []);

  useEffect(() => {
     if (gameState === GameState.GAMEOVER) {
        if (score > highScores[gameMode]) {
            const newHighs = { ...highScores, [gameMode]: score };
            setHighScores(newHighs);
            localStorage.setItem(`fly_highscore_${gameMode}`, score.toString());
        }
        const newStats = { ...stats };
        newStats.maxScore = Math.max(newStats.maxScore, score);
        newStats.totalScore += score;
        setStats(newStats);
        achievements.forEach(a => { if (!a.unlocked && a.condition(newStats)) unlockAchievement(a.id, a.reward); });
        
        // Final score check for secret items
        if (score >= 100000) {
            if (!ownedSkins.includes('legend_gold')) setOwnedSkins(prev => [...prev, 'legend_gold']);
            if (!ownedTrails.includes('gold_glitter')) setOwnedTrails(prev => [...prev, 'gold_glitter']);
        }

        if (score > 1000) setStreak(prev => prev + 1); else setStreak(0);
        setLeaderboard(prev => {
            const finalScore = Math.floor(score);
            if (finalScore === 0) return prev; 
            const newEntry: LeaderboardEntry = { name: playerName || 'Piloto', score: finalScore, date: new Date().toLocaleDateString() };
            const newBoard = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
            localStorage.setItem('fly_leaderboard', JSON.stringify(newBoard));
            return newBoard;
        });
     }
  }, [gameState]);

  const handleBuy = (type: 'model' | 'skin' | 'trail' | 'effect' | 'boost', id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    if (type === 'model') setOwnedModels(prev => [...prev, id]);
    if (type === 'skin') setOwnedSkins(prev => [...prev, id]);
    if (type === 'trail') setOwnedTrails(prev => [...prev, id]);
    if (type === 'effect') setOwnedEffects(prev => [...prev, id]);
    if (type === 'boost') setBoostInventory(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleOpenLootBox = (): LootResult | null => {
      if (totalCoins < LOOT_BOX_PRICE) return null;
      setTotalCoins(prev => prev - LOOT_BOX_PRICE);
      const { item, type } = getLootItem();
      let isOwned = false;
      if (type === 'model' && ownedModels.includes(item.id)) isOwned = true;
      if (type === 'skin' && ownedSkins.includes(item.id)) isOwned = true;
      if (type === 'trail' && ownedTrails.includes(item.id)) isOwned = true;
      if (type === 'effect' && ownedEffects.includes(item.id)) isOwned = true;
      if (isOwned) {
          const refund = Math.floor(item.price * 0.3) || 100;
          setTotalCoins(prev => prev + refund);
          return { item, type, duplicate: true, refund };
      } else {
          if (type === 'model') setOwnedModels(prev => [...prev, item.id]);
          if (type === 'skin') setOwnedSkins(prev => [...prev, item.id]);
          if (type === 'trail') setOwnedTrails(prev => [...prev, item.id]);
          if (type === 'effect') setOwnedEffects(prev => [...prev, item.id]);
          return { item, type, duplicate: false, refund: 0 };
      }
  };

  const handleEquip = (type: 'model' | 'skin' | 'trail' | 'effect', id: string) => {
    if (type === 'model') setCurrentModelId(id);
    if (type === 'skin') setCurrentSkinId(id);
    if (type === 'trail') setCurrentTrailId(id);
    if (type === 'effect') setCurrentEffectId(id);
  };

  const toggleActiveBoost = (boostId: BoostType) => {
      setActiveBoosts(prev => {
          if (prev.includes(boostId)) return prev.filter(b => b !== boostId);
          if ((boostInventory[boostId] || 0) > 0) return [...prev, boostId];
          return prev;
      });
  };

  const handleRedeemCode = (inputCode: string): { success: boolean; message: string; type?: 'poem' | 'reward' } => {
    const code = inputCode.trim();
    if (code === 'Y1UR3Xp4r4Fly!') {
        setOwnedModels(PLANE_MODELS.map(i => i.id));
        setOwnedSkins(PLANE_SKINS.map(i => i.id));
        setOwnedTrails(TRAILS.map(i => i.id));
        setOwnedEffects(DEATH_EFFECTS.map(i => i.id));
        return { success: true, message: '¡Modo Desarrollador Activado! Todo desbloqueado.', type: 'reward' };
    }
    if (code === 'GraciasEquipo') { addCoins(1000); return { success: true, message: '¡Gracias por tu ayuda! +1000 Monedas.', type: 'reward' }; }
    if (code === 'TeQuiero') { return { success: true, message: 'Poema desbloqueado.', type: 'poem' }; }
    if (['SOYTESTER1000', '/GIVEME5000', 'RECLAMOMIS10000'].includes(code)) {
        if (redeemedCodes.includes(code)) return { success: false, message: 'Este código ya ha sido canjeado.' };
        let reward = 0;
        if (code === 'SOYTESTER1000') reward = 1000;
        if (code === '/GIVEME5000') reward = 5000;
        if (code === 'RECLAMOMIS10000') reward = 10000;
        addCoins(reward);
        setRedeemedCodes(prev => [...prev, code]);
        return { success: true, message: `¡Código canjeado! +${reward} Monedas.`, type: 'reward' };
    }
    return { success: false, message: 'Código inválido.' };
  };

  const startGame = () => {
      soundManager.resumeContext();
      // REMOVED BUG: Music should only play if it was already playing or manually started
      const newInventory = { ...boostInventory };
      activeBoosts.forEach(b => { if (newInventory[b] > 0) newInventory[b]--; });
      setBoostInventory(newInventory);
      setGameState(GameState.PLAYING);
      setReviveSignal(0);
      setRevivesThisRun(0);
  };

  const handleRestart = () => {
    soundManager.resumeContext();
    setGameState(GameState.PLAYING);
    setReviveSignal(0);
    setRevivesThisRun(0);
  };

  const addCoins = useCallback((amount: number) => { setTotalCoins(prev => prev + amount); }, []);

  const toggleSkyState = () => {
      soundManager.init();
      soundManager.resumeContext();
      setSkyState(prev => {
          if (prev === SkyState.DAY) return SkyState.SUNSET;
          if (prev === SkyState.SUNSET) return SkyState.PURPLE_SUNSET;
          if (prev === SkyState.PURPLE_SUNSET) return SkyState.NIGHT;
          if (prev === SkyState.NIGHT) return SkyState.STORM;
          if (prev === SkyState.STORM) return SkyState.SNOW;
          if (prev === SkyState.SNOW) return SkyState.AUTO;
          return SkyState.DAY;
      });
  };

  const revivePlayer = useCallback(() => {
    setReviveSignal(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setRevivesThisRun(prev => prev + 1);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => { if (typeof event.data === 'string' && event.data === 'ad_completed') revivePlayer(); };
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any); 
    return () => { window.removeEventListener('message', handleMessage); document.removeEventListener('message', handleMessage as any); };
  }, [revivePlayer]);

  const handleReviveRequest = (method: 'ad' | 'coins') => {
      if (gameMode === GameMode.COMPETITION && revivesThisRun >= 3) return;
      if (method === 'coins') {
          if (totalCoins >= 200) { setTotalCoins(prev => prev - 200); revivePlayer(); }
      } else {
          if (window.Android && window.Android.showRewardedAd) { window.Android.showRewardedAd(); }
          else { revivePlayer(); } // Fallback for testing if no android interface
      }
  };

  const cycleGameMode = (dir: 1 | -1) => {
      const modes = [GameMode.NORMAL, GameMode.COMPETITION, GameMode.CHILL];
      const curIdx = modes.indexOf(gameMode);
      const nextIdx = (curIdx + dir + modes.length) % modes.length;
      setGameMode(modes[nextIdx]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <audio ref={audioRef} onEnded={handleAudioEnded} onError={(e) => console.log('Audio load error', e)} />
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        setScore={setScore}
        setCoinsCollected={setCoinsCollected}
        currentModelId={currentModelId}
        currentSkinId={currentSkinId}
        currentTrailId={currentTrailId}
        currentDeathEffectId={currentEffectId}
        addCoins={addCoins}
        activePowerUps={activePowerUps}
        setActivePowerUps={setActivePowerUps}
        skyState={skyState}
        reviveSignal={reviveSignal}
        onMissionUpdate={handleMissionUpdate}
        initialBoosts={activeBoosts}
        gameMode={gameMode}
      />
      <UIOverlay 
        gameState={gameState}
        score={score}
        highScore={highScores[gameMode]}
        coins={totalCoins}
        coinsCollectedInRun={coinsCollected}
        activePowerUps={activePowerUps}
        onStart={startGame}
        onOpenShop={() => setGameState(GameState.SHOP)}
        onRestart={handleRestart}
        onMenu={() => { setGameState(GameState.MENU); setReviveSignal(0); }}
        onPause={() => setGameState(GameState.PAUSED)}
        onResume={() => setGameState(GameState.PLAYING)}
        skyState={skyState}
        toggleSkyState={toggleSkyState}
        onRevive={handleReviveRequest}
        onOpenMissions={() => setGameState(GameState.MISSIONS)}
        missions={missions}
        achievements={achievements}
        streak={streak}
        boostInventory={boostInventory}
        activeBoosts={activeBoosts}
        onToggleBoost={toggleActiveBoost}
        musicCurrentTrackIndex={musicCurrentTrackIndex}
        musicIsPlaying={musicIsPlaying}
        musicIsShuffle={musicIsShuffle}
        musicIsLoop={musicIsLoop}
        onMusicPlayPause={handleMusicPlayPause}
        onMusicNext={handleMusicNext}
        onMusicPrev={handleMusicPrev}
        onMusicSelect={handleMusicSelect}
        onMusicToggleShuffle={handleMusicToggleShuffle}
        onMusicToggleLoop={handleMusicToggleLoop}
        musicVolume={musicVolume}
        setMusicVolume={setMusicVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
        leaderboard={leaderboard}
        playerName={playerName}
        setPlayerName={setPlayerName}
        onRedeemCode={handleRedeemCode}
        gameMode={gameMode}
        onCycleMode={cycleGameMode}
        revivesUsed={revivesThisRun}
      />
      {gameState === GameState.SHOP && (
        <Shop 
          coins={totalCoins}
          ownedModels={ownedModels}
          ownedSkins={ownedSkins}
          ownedTrails={ownedTrails}
          ownedDeathEffects={ownedEffects}
          boostInventory={boostInventory}
          currentModelId={currentModelId}
          currentSkinId={currentSkinId}
          currentTrailId={currentTrailId}
          currentDeathEffectId={currentEffectId}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onBack={() => setGameState(GameState.MENU)}
          onOpenLootBox={handleOpenLootBox}
        />
      )}
    </div>
  );
};

export default App;
