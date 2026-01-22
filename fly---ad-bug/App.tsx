
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Shop } from './components/Shop';
import { GameState, PowerUpType, SkyState, Mission, Achievement, GameStats, BoostType, LootResult, LeaderboardEntry, GameMode } from './types';
import { ACHIEVEMENTS_LIST, MUSIC_PLAYLIST, LOOT_BOX_PRICE, PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS } from './constants';
import { generateDailyMissions, soundManager, getLootItem } from './utils';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(() => (localStorage.getItem('fly_cur_mode') as GameMode) || GameMode.NORMAL);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [revivesThisRun, setRevivesThisRun] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // --- AUDIO SETTINGS ---
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('fly_vol_music');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('fly_vol_sfx');
    return saved ? parseFloat(saved) : 0.3;
  });

  // --- MUSIC ENGINE ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicCurrentTrackIndex, setMusicCurrentTrackIndex] = useState(() => Math.floor(Math.random() * MUSIC_PLAYLIST.length));
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicIsShuffle, setMusicIsShuffle] = useState(true);
  const [musicIsLoop, setMusicIsLoop] = useState(false);

  useEffect(() => {
      if (audioRef.current) audioRef.current.volume = musicVolume;
      localStorage.setItem('fly_vol_music', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
      soundManager.setVolume(sfxVolume);
      localStorage.setItem('fly_vol_sfx', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const track = MUSIC_PLAYLIST[musicCurrentTrackIndex];
      if (!track) return;
      if (audio.src !== track.src) audio.src = track.src;
      if (musicIsPlaying) audio.play().catch(() => {});
      else audio.pause();
  }, [musicCurrentTrackIndex, musicIsPlaying]);

  const handleAudioEnded = () => {
      if (musicIsLoop) {
          if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
      } else if (musicIsShuffle) {
          setMusicCurrentTrackIndex(Math.floor(Math.random() * MUSIC_PLAYLIST.length));
      } else {
          setMusicCurrentTrackIndex(prev => (prev + 1) % MUSIC_PLAYLIST.length);
      }
  };

  const handleMusicPlayPause = () => setMusicIsPlaying(prev => !prev);
  const handleMusicNext = () => setMusicCurrentTrackIndex(Math.floor(Math.random() * MUSIC_PLAYLIST.length));
  const handleMusicPrev = () => setMusicCurrentTrackIndex(prev => (prev - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length);
  const handleMusicSelect = (index: number) => { setMusicCurrentTrackIndex(index); setMusicIsPlaying(true); };

  // --- PERSISTENCE ---
  const [totalCoins, setTotalCoins] = useState<number>(() => parseInt(localStorage.getItem('fly_coins') || '0') || 0);
  const [ownedModels, setOwnedModels] = useState<string[]>(() => JSON.parse(localStorage.getItem('fly_models') || '["default"]'));
  const [ownedSkins, setOwnedSkins] = useState<string[]>(() => JSON.parse(localStorage.getItem('fly_skins') || '["default"]'));
  const [ownedTrails, setOwnedTrails] = useState<string[]>(() => JSON.parse(localStorage.getItem('fly_trails') || '["default"]'));
  const [ownedEffects, setOwnedEffects] = useState<string[]>(() => JSON.parse(localStorage.getItem('fly_effects') || '["default"]'));
  const [boostInventory, setBoostInventory] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem('fly_boosts') || '{}'));

  const [currentModelId, setCurrentModelId] = useState<string>(() => localStorage.getItem('fly_cur_model') || 'default');
  const [currentSkinId, setCurrentSkinId] = useState<string>(() => localStorage.getItem('fly_cur_skin') || 'default');
  const [currentTrailId, setCurrentTrailId] = useState<string>(() => localStorage.getItem('fly_cur_trail') || 'default');
  const [currentEffectId, setCurrentEffectId] = useState<string>(() => localStorage.getItem('fly_cur_effect') || 'default');

  const [activeBoosts, setActiveBoosts] = useState<BoostType[]>([]); 

  const [highScores, setHighScores] = useState<Record<GameMode, number>>(() => {
      const normal = parseInt(localStorage.getItem('fly_highscore_NORMAL') || localStorage.getItem('fly_highscore') || '0') || 0;
      const comp = parseInt(localStorage.getItem('fly_highscore_COMPETITION') || '0') || 0;
      const chill = parseInt(localStorage.getItem('fly_highscore_CHILL') || '0') || 0;
      return { [GameMode.NORMAL]: normal, [GameMode.COMPETITION]: comp, [GameMode.CHILL]: chill };
  });

  const [skyState, setSkyState] = useState<SkyState>(() => (localStorage.getItem('fly_skystate') as SkyState) || SkyState.DAY);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streak, setStreak] = useState<number>(() => parseInt(localStorage.getItem('fly_streak') || '0') || 0);
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('fly_stats');
    if (saved) return JSON.parse(saved);
    return { 
      totalScore: 0, 
      totalCoins: 0, 
      totalTime: 0, 
      totalMissilesDodged: 0, 
      missilesDestroyed: 0, 
      gamesPlayed: 0, 
      maxScore: 0 
    };
  });
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('fly_player_name') || 'Piloto');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => JSON.parse(localStorage.getItem('fly_leaderboard') || '[]'));

  useEffect(() => { localStorage.setItem('fly_coins', totalCoins.toString()); }, [totalCoins]);
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
  useEffect(() => { localStorage.setItem('fly_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('fly_player_name', playerName); }, [playerName]);
  useEffect(() => { localStorage.setItem('fly_cur_mode', gameMode); }, [gameMode]);

  const revivePlayer = useCallback(() => {
    setIsWatchingAd(false);
    setReviveSignal(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setRevivesThisRun(prev => prev + 1);
  }, []);

  // --- AD BRIDGE SETUP ---
  useEffect(() => {
    (window as any).onAdCompleted = () => {
        revivePlayer();
    };
    (window as any).onAdFailed = () => {
        setIsWatchingAd(false);
    };
  }, [revivePlayer]);

  // Temporizador de seguridad: si el anuncio falla en cargar o el puente se rompe,
  // desbloqueamos la UI para que el jugador no se quede "congelado".
  useEffect(() => {
      let timeout: any;
      if (isWatchingAd) {
          timeout = setTimeout(() => {
              console.warn("Ad system timed out or failed to trigger callback.");
              setIsWatchingAd(false);
          }, 7000); 
      }
      return () => clearTimeout(timeout);
  }, [isWatchingAd]);

  useEffect(() => {
    const lastDate = localStorage.getItem('fly_mission_date');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        const newMissions = generateDailyMissions();
        setMissions(newMissions);
        localStorage.setItem('fly_mission_date', today);
        localStorage.setItem('fly_missions', JSON.stringify(newMissions));
    } else {
        setMissions(JSON.parse(localStorage.getItem('fly_missions') || '[]'));
    }
    const unlockedIds = JSON.parse(localStorage.getItem('fly_achievements_unlocked') || '[]');
    setAchievements(prev => prev.map(a => ({...a, unlocked: unlockedIds.includes(a.id)})));

    const tutorialDone = localStorage.getItem('fly_tutorial_done');
    if (!tutorialDone) {
        setGameState(GameState.TUTORIAL);
    }
  }, []);

  const unlockAchievement = (id: string, reward: number) => {
      const unlockedIds = JSON.parse(localStorage.getItem('fly_achievements_unlocked') || '[]');
      if (!unlockedIds.includes(id)) {
          unlockedIds.push(id);
          localStorage.setItem('fly_achievements_unlocked', JSON.stringify(unlockedIds));
          setAchievements(prev => prev.map(a => a.id === id ? {...a, unlocked: true} : a));
          setTotalCoins(prev => prev + reward);
          if (id === 'minecraft_advancement') {
              setOwnedSkins(prev => Array.from(new Set([...prev, 'legend_gold'])));
              setOwnedTrails(prev => Array.from(new Set([...prev, 'gold_glitter'])));
          }
      }
  };

  const handleMissionUpdate = useCallback((type: string, amount: number) => {
      setMissions(prev => {
          let rewardToAdd = 0;
          const updated = prev.map(m => {
              if (!m.completed && m.type === type) {
                  const newCurrent = m.current + amount;
                  if (newCurrent >= m.target) { rewardToAdd += m.reward; return { ...m, current: newCurrent, completed: true }; }
                  return { ...m, current: newCurrent };
              }
              return m;
          });
          if (rewardToAdd > 0) setTotalCoins(c => c + rewardToAdd);
          localStorage.setItem('fly_missions', JSON.stringify(updated));
          return updated;
      });
      
      setStats(prev => {
        const isEpicSession = gameMode !== GameMode.CHILL;
        return {
          ...prev, 
          totalScore: (isEpicSession && type === 'score') ? prev.totalScore + amount : prev.totalScore, 
          totalCoins: type === 'coins' ? prev.totalCoins + amount : prev.totalCoins, 
          totalMissilesDodged: type === 'score' && amount === 25 ? prev.totalMissilesDodged + 1 : prev.totalMissilesDodged, 
          missilesDestroyed: type === 'missiles' ? prev.missilesDestroyed + amount : prev.missilesDestroyed,
          totalTime: type === 'time' ? prev.totalTime + amount : prev.totalTime
        };
      });
  }, [gameMode]);

  useEffect(() => {
     if (gameState === GameState.GAMEOVER) {
        if (score > highScores[gameMode]) {
            const newHighs = { ...highScores, [gameMode]: score };
            setHighScores(newHighs);
            localStorage.setItem(`fly_highscore_${gameMode}`, score.toString());
        }
        
        const isEpicSession = gameMode !== GameMode.CHILL;
        const newStats = { 
            ...stats, 
            maxScore: Math.max(stats.maxScore, score), 
            totalScore: isEpicSession ? stats.totalScore + score : stats.totalScore 
        };
        setStats(newStats);

        if (gameMode === GameMode.NORMAL || gameMode === GameMode.COMPETITION) {
            achievements.forEach(a => { 
                if (!a.unlocked && a.condition(newStats)) {
                    unlockAchievement(a.id, a.reward); 
                }
            });
            
            if (score >= 100000) {
                setOwnedSkins(prev => Array.from(new Set([...prev, 'legend_gold'])));
                setOwnedTrails(prev => Array.from(new Set([...prev, 'gold_glitter'])));
            }
        }

        if (score > 1000) setStreak(prev => prev + 1); else setStreak(0);
        setLeaderboard(prev => {
            if (score === 0) return prev;
            const newBoard = [...prev, { name: playerName || 'Piloto', score: Math.floor(score), date: new Date().toLocaleDateString() }].sort((a, b) => b.score - a.score).slice(0, 10);
            localStorage.setItem('fly_leaderboard', JSON.stringify(newBoard));
            return newBoard;
        });
     }
  }, [gameState]);

  const handleBuy = (type: 'model' | 'skin' | 'trail' | 'effect' | 'boost', id: string, cost: number) => {
    if (totalCoins < cost || cost === 0) return;
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
      const pool: Record<string, string[]> = { model: ownedModels, skin: ownedSkins, trail: ownedTrails, effect: ownedEffects };
      if (pool[type].includes(item.id)) {
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
      setActiveBoosts(prev => prev.includes(boostId) ? prev.filter(b => b !== boostId) : (boostInventory[boostId] > 0 ? [...prev, boostId] : prev));
  };

  const handleRedeemCode = (inputCode: string) => {
    const code = inputCode.trim();
    if (code === 'Y1UR3Xp4r4Fly!') {
        setOwnedModels(PLANE_MODELS.map(i => i.id)); setOwnedSkins(PLANE_SKINS.map(i => i.id)); setOwnedTrails(TRAILS.map(i => i.id)); setOwnedEffects(DEATH_EFFECTS.map(i => i.id));
        return { success: true, message: '¡Todo desbloqueado!', type: 'reward' as const };
    }
    return { success: false, message: 'Código inválido.' };
  };

  const startGame = () => {
      soundManager.resumeContext();
      const newInventory = { ...boostInventory };
      activeBoosts.forEach(b => { if (newInventory[b] > 0) newInventory[b]--; });
      setBoostInventory(newInventory);
      setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
      setGameState(GameState.PLAYING);
      setReviveSignal(0);
      setRevivesThisRun(0);
  };

  const addCoins = useCallback((amount: number) => { setTotalCoins(prev => prev + amount); }, []);

  const toggleSkyState = () => {
      setSkyState(prev => {
          const states = [SkyState.DAY, SkyState.SUNSET, SkyState.PURPLE_SUNSET, SkyState.NIGHT, SkyState.STORM, SkyState.SNOW, SkyState.AUTO];
          return states[(states.indexOf(prev) + 1) % states.length];
      });
  };

  const handleReviveRequest = (method: 'ad' | 'coins') => {
      if (gameMode === GameMode.COMPETITION && revivesThisRun >= 3) return;
      if (method === 'coins') {
          if (totalCoins >= 200) { setTotalCoins(prev => prev - 200); revivePlayer(); }
      } else {
          setIsWatchingAd(true);
          if (window.Android && typeof window.Android.showRewardedAd === 'function') {
              window.Android.showRewardedAd();
          } else {
              // En entorno web estándar sin bridge, simplemente esperamos a que el timeout de seguridad
              // libere la UI o el usuario use monedas, ya que no hay un sistema de anuncios real disponible.
              console.log("Solicitud de anuncio enviada. Esperando señal del sistema...");
          }
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <audio ref={audioRef} onEnded={handleAudioEnded} />
      <GameCanvas 
        gameState={gameState} setGameState={setGameState} setScore={setScore} setCoinsCollected={setCoinsCollected}
        currentModelId={currentModelId} currentSkinId={currentSkinId} currentTrailId={currentTrailId} currentDeathEffectId={currentEffectId}
        addCoins={addCoins} activePowerUps={activePowerUps} setActivePowerUps={setActivePowerUps} skyState={skyState}
        reviveSignal={reviveSignal} onMissionUpdate={handleMissionUpdate} initialBoosts={activeBoosts} gameMode={gameMode}
      />
      <UIOverlay 
        gameState={gameState} score={score} highScore={highScores[gameMode]} coins={totalCoins} coinsCollectedInRun={coinsCollected}
        activePowerUps={activePowerUps} onStart={startGame} onOpenShop={() => setGameState(GameState.SHOP)} onRestart={() => setGameState(GameState.PLAYING)}
        onMenu={() => setGameState(GameState.MENU)} onPause={() => setGameState(GameState.PAUSED)} onResume={() => setGameState(GameState.PLAYING)}
        skyState={skyState} toggleSkyState={toggleSkyState} onRevive={handleReviveRequest} onOpenMissions={() => setGameState(GameState.MISSIONS)}
        missions={missions} achievements={achievements} streak={streak} boostInventory={boostInventory} activeBoosts={activeBoosts}
        onToggleBoost={toggleActiveBoost} musicCurrentTrackIndex={musicCurrentTrackIndex} musicIsPlaying={musicIsPlaying}
        musicIsShuffle={musicIsShuffle} musicIsLoop={musicIsLoop} onMusicPlayPause={handleMusicPlayPause} onMusicNext={handleMusicNext}
        onMusicPrev={handleMusicPrev} onMusicSelect={handleMusicSelect} onMusicToggleShuffle={() => setMusicIsShuffle(p => !p)}
        onMusicToggleLoop={() => setMusicIsLoop(p => !p)} musicVolume={musicVolume} setMusicVolume={setMusicVolume}
        sfxVolume={sfxVolume} setSfxVolume={setSfxVolume} leaderboard={leaderboard} playerName={playerName} setPlayerName={setPlayerName}
        onRedeemCode={handleRedeemCode} gameMode={gameMode} onCycleMode={(dir) => {
            const modes = [GameMode.NORMAL, GameMode.COMPETITION, GameMode.CHILL];
            setGameMode(modes[(modes.indexOf(gameMode) + dir + modes.length) % modes.length]);
        }} revivesUsed={revivesThisRun}
        isWatchingAd={isWatchingAd} stats={stats}
        onTutorialComplete={() => { localStorage.setItem('fly_tutorial_done', 'true'); setGameState(GameState.MENU); }}
      />
      {gameState === GameState.SHOP && (
        <Shop 
          coins={totalCoins} ownedModels={ownedModels} ownedSkins={ownedSkins} ownedTrails={ownedTrails} ownedDeathEffects={ownedEffects}
          boostInventory={boostInventory} currentModelId={currentModelId} currentSkinId={currentSkinId} currentTrailId={currentTrailId}
          currentDeathEffectId={currentEffectId} onBuy={handleBuy} onEquip={handleEquip} onBack={() => setGameState(GameState.MENU)} onOpenLootBox={handleOpenLootBox}
        />
      )}
    </div>
  );
};

export default App;
