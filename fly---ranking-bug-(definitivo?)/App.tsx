
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Shop } from './components/Shop';
import { GameState, PowerUpType, SkyState, Mission, Achievement, GameStats, BoostType, LootResult, LeaderboardEntry, GameMode, RankingPeriod } from './types';
import { ACHIEVEMENTS_LIST, MUSIC_PLAYLIST, LOOT_BOX_PRICE, PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS } from './constants';
import { generateDailyMissions, soundManager, getLootItem, getPeriodKey } from './utils';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
    return { totalScore: 0, totalCoins: 0, totalTime: 0, totalMissilesDodged: 0, missilesDestroyed: 0, gamesPlayed: 0, maxScore: 0 };
  });
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('fly_player_name') || 'Piloto');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);

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

  // --- FIREBASE SYNC LOGIC ---
  const saveGlobalScore = useCallback(async (finalScore: number) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("⚠️ No se puede guardar el score: El usuario no está autenticado.");
            return;
        }

        const periods: RankingPeriod[] = ['daily', 'weekly', 'monthly', 'all_time'];
        const pKeys = periods.map(p => ({ period: p, key: getPeriodKey(p) }));

        for (const { period, key } of pKeys) {
            const scoreRef = doc(db, 'leaderboards', key, 'entries', user.uid);
            const scoreSnap = await getDoc(scoreRef);
            const oldScore = scoreSnap.exists() ? scoreSnap.data().score : 0;

            if (finalScore > oldScore) {
                await setDoc(scoreRef, {
                    uid: user.uid,
                    name: playerName,
                    score: finalScore,
                    timestamp: new Date()
                }, { merge: true });
            }
        }
        
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: playerName,
            lastUpdated: new Date()
        }, { merge: true });

        console.log("✈️ Sincronización global completada con éxito.");
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.error("❌ Firestore: Permisos insuficientes. Revisa las reglas de seguridad en la consola de Firebase.");
        } else {
            console.error("❌ Error guardando score global:", error);
        }
    }
  }, [playerName]);

  const loadLeaderboard = useCallback(async (period: RankingPeriod) => {
    try {
        const key = getPeriodKey(period);
        const q = query(collection(db, 'leaderboards', key, 'entries'), orderBy('score', 'desc'), limit(10));
        const snap = await getDocs(q);
        const entries: LeaderboardEntry[] = snap.docs.map(doc => doc.data() as LeaderboardEntry);
        setLeaderboard(entries);

        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, 'leaderboards', key, 'entries', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userScore = userSnap.data().score;
                const rankQuery = query(collection(db, 'leaderboards', key, 'entries'), where('score', '>', userScore));
                const rankSnap = await getCountFromServer(rankQuery);
                setPlayerRank(rankSnap.data().count + 1);
            } else {
                setPlayerRank(null);
            }
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.error("❌ Firestore: No se pudo cargar el ranking por permisos insuficientes.");
        } else {
            console.error("❌ Error cargando ranking:", error);
        }
        setLeaderboard([]);
        setPlayerRank(null);
    }
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (userSnap.exists()) {
              const remoteName = userSnap.data().name;
              if (remoteName && remoteName !== playerName) {
                setPlayerName(remoteName);
              }
            }
        } catch (e) {
            console.warn("⚠️ No se pudo sincronizar el nombre remoto (posiblemente falta de reglas o perfil nuevo).");
        }
      }
    });
  }, []);

  const revivePlayer = useCallback(() => {
    setReviveSignal(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setRevivesThisRun(prev => prev + 1);
    setIsWatchingAd(false);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && event.data === 'ad_completed') revivePlayer();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [revivePlayer]);

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
    setAchievements(prev => prev.map(a => unlockedIds.includes(a.id) ? {...a, unlocked: true} : a));
    if (!localStorage.getItem('fly_tutorial_done')) setGameState(GameState.TUTORIAL);
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
            // Si es récord, intentar guardar en Firebase
            if (gameMode !== GameMode.CHILL) saveGlobalScore(score);
        }
        const isEpicSession = gameMode !== GameMode.CHILL;
        const newStats = { ...stats, maxScore: Math.max(stats.maxScore, score), totalScore: isEpicSession ? stats.totalScore + score : stats.totalScore };
        setStats(newStats);
        if (gameMode !== GameMode.CHILL) {
            achievements.forEach(a => { if (!a.unlocked && a.condition(newStats)) unlockAchievement(a.id, a.reward); });
            if (score >= 100000) { setOwnedSkins(prev => Array.from(new Set([...prev, 'legend_gold']))); setOwnedTrails(prev => Array.from(new Set([...prev, 'gold_glitter']))); }
        }
        if (score > 1000) setStreak(prev => prev + 1); else setStreak(0);
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

  const toggleActiveBoost = (boostId: BoostType) => setActiveBoosts(prev => prev.includes(boostId) ? prev.filter(b => b !== boostId) : (boostInventory[boostId] > 0 ? [...prev, boostId] : prev));

  const handleRedeemCode = (inputCode: string) => {
    if (inputCode.trim() === 'Y1UR3Xp4r4Fly!') {
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

  const toggleSkyState = () => setSkyState(prev => {
      const states = [SkyState.DAY, SkyState.SUNSET, SkyState.PURPLE_SUNSET, SkyState.NIGHT, SkyState.STORM, SkyState.SNOW, SkyState.AUTO];
      return states[(states.indexOf(prev) + 1) % states.length];
  });

  const handleReviveRequest = (method: 'ad' | 'coins') => {
      if (method === 'coins') { if (totalCoins >= 200) { setTotalCoins(prev => prev - 200); revivePlayer(); } } 
      else { if (window.Android?.showRewardedAd) { setIsWatchingAd(true); window.Android.showRewardedAd(); } else console.log('Ad requested but Android interface not found.'); }
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
        activePowerUps={activePowerUps} onStart={startGame} onOpenShop={() => setGameState(GameState.SHOP)} onRestart={startGame}
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
        loadLeaderboard={loadLeaderboard} playerRank={playerRank}
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
