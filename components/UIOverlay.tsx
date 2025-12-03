import React from 'react';
import { GameState, PowerUpType, SkyState, Mission, Achievement, BoostType } from '../types';
import { POWERUP_LABELS, POWERUP_COLORS, BOOSTS } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  highScore: number;
  coins: number;
  coinsCollectedInRun: number;
  activePowerUps: PowerUpType[];
  onStart: () => void;
  onOpenShop: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onPause: () => void;
  onResume: () => void;
  skyState: SkyState;
  toggleSkyState: () => void;
  onRevive: (method: 'ad' | 'coins') => void;
  onOpenMissions: () => void;
  missions: Mission[];
  achievements: Achievement[];
  streak: number;
  boostInventory: Record<string, number>;
  activeBoosts: BoostType[];
  onToggleBoost: (boostId: BoostType) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  score,
  highScore,
  coins,
  coinsCollectedInRun,
  activePowerUps,
  onStart,
  onOpenShop,
  onRestart,
  onMenu,
  onPause,
  onResume,
  skyState,
  toggleSkyState,
  onRevive,
  onOpenMissions,
  missions,
  achievements,
  streak,
  boostInventory,
  activeBoosts,
  onToggleBoost
}) => {
  const isNewRecord = score > highScore && highScore > 0;

  const renderSkyIcon = () => {
      switch(skyState) {
          case SkyState.DAY: return '☀️';
          case SkyState.SUNSET: return '🌅';
          case SkyState.NIGHT: return '🌙';
          case SkyState.AUTO: return '🔄';
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 font-fredoka select-none overflow-hidden">
      
      {/* Top Bar Controls - Increased z-index to 60 to sit above Menu layer */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none z-[60]">
        <div className="pointer-events-auto flex gap-2">
          {gameState === GameState.PLAYING && (
            <button 
              onClick={onPause}
              className="p-3 rounded-full shadow-lg border-2 flex items-center justify-center w-12 h-12 bg-white/20 border-white/50 text-white backdrop-blur-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </button>
          )}
        </div>

        <div className="pointer-events-auto">
          <button 
            onClick={toggleSkyState}
            className="p-3 rounded-full shadow-lg border-2 w-12 h-12 flex items-center justify-center bg-white/20 border-white/50 backdrop-blur-md text-2xl hover:bg-white/30 transition-colors"
          >
            {renderSkyIcon()}
          </button>
        </div>
      </div>

      {/* HUD (Playing) */}
      {gameState === GameState.PLAYING && (
        <>
          <div className="flex justify-between items-start w-full mt-20">
            <div className="flex flex-col gap-1 pointer-events-auto">
              <div className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] italic">
                {Math.floor(score)}
              </div>
              <div className="text-sm font-bold text-white/60 tracking-wider">METROS</div>
              {streak > 0 && (
                  <div className="mt-1 text-yellow-300 font-bold text-xs animate-pulse">🔥 RACHA x{streak}</div>
              )}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md pointer-events-auto bg-black/20 border-white/20">
              <span className="text-2xl">💰</span>
              <span className="text-xl font-bold text-yellow-400">{coinsCollectedInRun}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-start mt-auto mb-20 pointer-events-auto">
            {activePowerUps.map((type) => (
              <div 
                key={type}
                className="px-4 py-2 rounded-lg font-bold text-white text-sm shadow-lg flex items-center gap-2 animate-pulse"
                style={{ backgroundColor: POWERUP_COLORS[type] }}
              >
                {type === PowerUpType.SHIELD && <span>🛡️</span>}
                {type === PowerUpType.SPEED && <span>🚀</span>}
                {type === PowerUpType.MAGNET && <span>🧲</span>}
                {type === PowerUpType.SHOCKWAVE && <span>💥</span>}
                {type === PowerUpType.ALLIES && <span>✈️</span>}
                {POWERUP_LABELS[type]}
              </div>
            ))}
          </div>
        </>
      )}

      {/* PAUSE MENU */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-black/60 pointer-events-auto z-50">
          <h2 className="text-6xl font-black text-white drop-shadow-lg mb-8 italic tracking-widest">PAUSA</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={onResume}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-2xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
            >
              CONTINUAR
            </button>
            <button 
              onClick={onMenu}
              className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xl backdrop-blur-sm transition-all"
            >
              MENÚ
            </button>
          </div>
        </div>
      )}

      {/* MAIN MENU */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50">
          <div className="mb-12 text-center animate-bounce-slow">
            <h1 className="text-8xl font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] italic tracking-tighter transform -skew-x-6">
              FLY!
            </h1>
            <p className="mt-2 text-blue-200 font-bold tracking-[0.5em] text-sm shadow-black drop-shadow-md">PAPER PLANE</p>
          </div>

          <div className="mb-8 text-center bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-wider mb-1">MEJOR PUNTUACIÓN</p>
            <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{highScore}</p>
          </div>

          {/* PRE-GAME BOOSTER SELECTOR */}
          <div className="mb-8 w-full max-w-sm px-4">
              <p className="text-center text-cyan-200/60 text-[10px] font-bold mb-3 uppercase tracking-widest">SISTEMAS PRE-VUELO</p>
              <div className="flex justify-center gap-4">
                  {BOOSTS.map(boost => {
                      const count = boostInventory[boost.id] || 0;
                      const isActive = activeBoosts.includes(boost.id);
                      const hasStock = count > 0;
                      
                      return (
                          <button
                            key={boost.id}
                            onClick={() => onToggleBoost(boost.id)}
                            disabled={!hasStock}
                            className={`
                                relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300
                                ${isActive 
                                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110 z-10' 
                                    : hasStock 
                                        ? 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5' 
                                        : 'bg-black/60 border-white/5 opacity-40 grayscale'}
                            `}
                          >
                              {boost.icon}
                              <div className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border ${hasStock ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                                  {count}
                              </div>
                          </button>
                      );
                  })}
              </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs px-6">
            <button 
              onClick={onStart}
              className="group relative w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-full font-black text-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105 active:scale-95 border-4 border-green-300/30"
            >
              <span className="drop-shadow-md tracking-wider">DESPEGAR</span>
            </button>
            
            <button 
              onClick={onOpenShop}
              className="w-full py-4 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl font-bold text-lg shadow-lg border border-purple-500/30 backdrop-blur-sm flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              <span>HANGAR</span>
              <span className="bg-black/40 px-3 py-1 rounded-full text-xs font-mono text-yellow-300 border border-yellow-500/20">💰 {coins}</span>
            </button>

            <button 
              onClick={onOpenMissions}
              className="w-full py-4 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg border border-indigo-400/30 backdrop-blur-sm flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <span>📜 MISIONES Y LOGROS</span>
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50 bg-red-900/80 backdrop-blur-md">
          <div className="text-center mb-8 animate-bounce-short">
             {isNewRecord ? (
                 <>
                    <h2 className="text-5xl font-black text-yellow-300 drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] mb-2 italic">¡NUEVO RÉCORD!</h2>
                    <p className="text-white text-xl">¡Impresionante piloto!</p>
                 </>
             ) : (
                 <>
                    <h2 className="text-6xl font-black text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] mb-2 italic">GAME OVER</h2>
                    <p className="text-white/80 text-xl">¿Eso es todo lo que tienes?</p>
                 </>
             )}
          </div>

          <div className="bg-black/40 p-6 rounded-3xl backdrop-blur-sm border border-white/10 w-full max-w-xs mb-8">
            <div className="flex justify-between items-end mb-2">
                <span className="text-white/60 font-bold">PUNTUACIÓN</span>
                <span className="text-3xl font-black text-white">{Math.floor(score)}</span>
            </div>
            <div className="w-full h-px bg-white/10 mb-2"></div>
            <div className="flex justify-between items-end">
                <span className="text-white/60 font-bold">MONEDAS</span>
                <span className="text-2xl font-bold text-yellow-400">+{coinsCollectedInRun}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={() => onRevive('ad')}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-black text-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 animate-pulse"
            >
              <span>REVIVIR (ANUNCIO)</span> 🎬
            </button>

            <button 
              onClick={onRestart}
              className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xl shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
            >
              REINTENTAR
            </button>
            <button 
              onClick={onMenu}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg backdrop-blur-sm"
            >
              MENÚ PRINCIPAL
            </button>
          </div>
        </div>
      )}

      {/* MISSIONS & ACHIEVEMENTS MODAL */}
      {gameState === GameState.MISSIONS && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50 bg-slate-900/95 backdrop-blur-xl p-4 touch-action-pan-y overflow-y-auto">
              <div className="w-full max-w-2xl bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl mt-10 mb-10">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-3xl font-bold text-white">Misiones y Logros</h2>
                      <button onClick={onMenu} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20">✕</button>
                  </div>

                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">📅 Misiones Diarias</h3>
                      <div className="space-y-3">
                          {missions.map(m => (
                              <div key={m.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                  <div className="flex-1">
                                      <p className="text-white font-bold">{m.description}</p>
                                      <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                                          <div className="bg-blue-500 h-full transition-all" style={{width: `${Math.min(100, (m.current/m.target)*100)}%`}}></div>
                                      </div>
                                      <p className="text-xs text-white/50 mt-1">{m.current} / {m.target}</p>
                                  </div>
                                  <div className="ml-4 flex flex-col items-end">
                                      {m.completed ? (
                                          <span className="text-green-400 font-bold text-sm">✓ COMPLETADO</span>
                                      ) : (
                                          <span className="text-yellow-400 font-bold text-sm">+{m.reward} 💰</span>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">🏆 Logros</h3>
                      <div className="space-y-3">
                          {achievements.map(a => (
                              <div key={a.id} className={`p-4 rounded-xl border flex justify-between items-center ${a.unlocked ? 'bg-purple-500/20 border-purple-500/50' : 'bg-black/20 border-white/5 opacity-70'}`}>
                                  <div>
                                      <h4 className={`font-bold ${a.unlocked ? 'text-white' : 'text-white/50'}`}>{a.title}</h4>
                                      <p className="text-sm text-white/60">{a.description}</p>
                                  </div>
                                  <div className="ml-4">
                                      {a.unlocked ? (
                                          <span className="text-purple-300 font-bold text-xs bg-purple-500/20 px-2 py-1 rounded">DESBLOQUEADO</span>
                                      ) : (
                                          <span className="text-white/40 font-bold text-sm">🔒 {a.reward} 💰</span>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <button 
                    onClick={onMenu}
                    className="mt-8 w-full py-4 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold text-xl shadow-lg transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                  >
                    VOLVER AL MENÚ
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};