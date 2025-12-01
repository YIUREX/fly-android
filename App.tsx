import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Shop } from './components/Shop';
import { GameState, PowerUpType, SkyState, Mission, Achievement, GameStats, BoostType } from './types';
import { ACHIEVEMENTS_LIST } from './constants';
import { generateDailyMissions, soundManager } from './utils';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [reviveSignal, setReviveSignal] = useState(0);

  // --- PERSISTENCE ---
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('fly_coins') || '0') || 0; } catch { return 0; }
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

  const [currentSkinId, setCurrentSkinId] = useState<string>(() => localStorage.getItem('fly_cur_skin') || 'default');
  const [currentTrailId, setCurrentTrailId] = useState<string>(() => localStorage.getItem('fly_cur_trail') || 'default');
  const [currentEffectId, setCurrentEffectId] = useState<string>(() => localStorage.getItem('fly_cur_effect') || 'default');

  const [activeBoosts, setActiveBoosts] = useState<BoostType[]>([]); // Boosts selected for next game

  const [highScore, setHighScore] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('fly_highscore') || '0') || 0; } catch { return 0; }
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

  useEffect(() => { localStorage.setItem('fly_coins', totalCoins.toString()); }, [totalCoins]);
  useEffect(() => { localStorage.setItem('fly_skins', JSON.stringify(ownedSkins)); }, [ownedSkins]);
  useEffect(() => { localStorage.setItem('fly_trails', JSON.stringify(ownedTrails)); }, [ownedTrails]);
  useEffect(() => { localStorage.setItem('fly_effects', JSON.stringify(ownedEffects)); }, [ownedEffects]);
  useEffect(() => { localStorage.setItem('fly_boosts', JSON.stringify(boostInventory)); }, [boostInventory]);
  useEffect(() => { localStorage.setItem('fly_cur_skin', currentSkinId); }, [currentSkinId]);
  useEffect(() => { localStorage.setItem('fly_cur_trail', currentTrailId); }, [currentTrailId]);
  useEffect(() => { localStorage.setItem('fly_cur_effect', currentEffectId); }, [currentEffectId]);
  useEffect(() => { localStorage.setItem('fly_skystate', skyState); }, [skyState]);
  useEffect(() => { localStorage.setItem('fly_streak', streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem('fly_stats', JSON.stringify(stats)); }, [stats]);

  useEffect(() => {
    const lastDate = localStorage.getItem('fly_mission_date');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
        const newMissions = generateDailyMissions();
        setMissions(newMissions);
        localStorage.setItem('fly_mission_date', today);
        localStorage.setItem('fly_missions', JSON.stringify(newMissions));
    } else {
        try {
            setMissions(JSON.parse(localStorage.getItem('fly_missions') || '[]'));
        } catch {
            setMissions(generateDailyMissions());
        }
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
      }
  };

  const handleMissionUpdate = useCallback((type: string, amount: number) => {
      setMissions(prev => {
          const updated = prev.map(m => {
              if (!m.completed && m.type === type) {
                  const newCurrent = m.current + amount;
                  if (newCurrent >= m.target) {
                      setTotalCoins(c => c + m.reward);
                      return { ...m, current: newCurrent, completed: true };
                  }
                  return { ...m, current: newCurrent };
              }
              return m;
          });
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
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('fly_highscore', score.toString());
        }
        
        const newStats = { ...stats };
        newStats.maxScore = Math.max(newStats.maxScore, score);
        newStats.totalScore += score;
        setStats(newStats);

        achievements.forEach(a => {
            if (!a.unlocked && a.condition(newStats)) {
                unlockAchievement(a.id, a.reward);
            }
        });

        if (score > 1000) {
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
     }
  }, [gameState]);


  const handleBuy = (type: 'skin' | 'trail' | 'effect' | 'boost', id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins(prev => prev - cost);
    if (type === 'skin') setOwnedSkins(prev => [...prev, id]);
    if (type === 'trail') setOwnedTrails(prev => [...prev, id]);
    if (type === 'effect') setOwnedEffects(prev => [...prev, id]);
    if (type === 'boost') {
        setBoostInventory(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + 1
        }));
    }
  };

  const handleEquip = (type: 'skin' | 'trail' | 'effect', id: string) => {
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

  const startGame = () => {
      soundManager.resumeContext();
      // Consume boosts
      const newInventory = { ...boostInventory };
      activeBoosts.forEach(b => {
          if (newInventory[b] > 0) newInventory[b]--;
      });
      setBoostInventory(newInventory);
      setGameState(GameState.PLAYING);
      setReviveSignal(0);
  };

  const handleRestart = () => {
    soundManager.resumeContext();
    setGameState(GameState.PLAYING);
    setReviveSignal(0);
  };

  const addCoins = useCallback((amount: number) => {
    setTotalCoins(prev => prev + amount);
  }, []);

  const toggleSkyState = () => {
      setSkyState(prev => {
          if (prev === SkyState.DAY) return SkyState.SUNSET;
          if (prev === SkyState.SUNSET) return SkyState.NIGHT;
          if (prev === SkyState.NIGHT) return SkyState.AUTO;
          return SkyState.DAY;
      });
  };

  const revivePlayer = useCallback(() => {
    setReviveSignal(prev => prev + 1);
    setGameState(GameState.PLAYING);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && event.data === 'ad_completed') {
        revivePlayer();
      }
    };
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any); 
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
    };
  }, [revivePlayer]);

  const handleReviveRequest = (method: 'ad' | 'coins') => {
      if (method === 'coins') {
          if (totalCoins >= 200) {
              setTotalCoins(prev => prev - 200);
              revivePlayer();
          }
      } else {
          // Strict production mode: Only call Android interface.
          // No fallback to simulate ad watching.
          if (window.Android && window.Android.showRewardedAd) {
              window.Android.showRewardedAd();
          } else {
              console.log('Ad requested but Android interface not found.');
          }
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        setScore={setScore}
        setCoinsCollected={setCoinsCollected}
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
      />
      
      <UIOverlay 
        gameState={gameState}
        score={score}
        highScore={highScore}
        coins={totalCoins}
        coinsCollectedInRun={coinsCollected}
        activePowerUps={activePowerUps}
        onStart={startGame}
        onOpenShop={() => setGameState(GameState.SHOP)}
        onRestart={handleRestart}
        onMenu={() => {
            setGameState(GameState.MENU);
            setReviveSignal(0);
        }}
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
      />

      {gameState === GameState.SHOP && (
        <Shop 
          coins={totalCoins}
          ownedSkins={ownedSkins}
          ownedTrails={ownedTrails}
          ownedDeathEffects={ownedEffects}
          boostInventory={boostInventory}
          currentSkinId={currentSkinId}
          currentTrailId={currentTrailId}
          currentDeathEffectId={currentEffectId}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onBack={() => setGameState(GameState.MENU)}
        />
      )}
    </div>
  );
};

export default App;