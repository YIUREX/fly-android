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
      
      {/* Top Bar Controls */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none z-20">
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
            className="p-3 rounded-full shadow-lg border-2 w-12 h-12 flex items-center justify-center bg-white/20 border-white/50 backdrop-blur-md text-2xl"
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
                {/* Simple Icons for HUD */}
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
              className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-lg border-2 border-white/10"
            >
              SALIR AL MENÚ
            </button>
          </div>
        </div>
      )}

      {/* MISSIONS & ACHIEVEMENTS MODAL */}
      {gameState === GameState.MISSIONS && (
        <div className="absolute inset-0 flex flex-col items-center p-4 backdrop-blur-md bg-slate-900/95 pointer-events-auto z-50 overflow-y-auto">
            <div className="w-full max-w-lg mt-10">
                <h2 className="text-4xl font-bold text-white mb-6 text-center">Misiones y Logros</h2>
                
                <div className="bg-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">📅 Misiones Diarias</h3>
                    <div className="space-y-3">
                        {missions.map(m => (
                            <div key={m.id} className="bg-black/20 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="text-white font-bold text-sm">{m.description}</div>
                                    <div className="text-white/50 text-xs mt-1">Progreso: {Math.min(m.current, m.target)} / {m.target}</div>
                                    <div className="w-32 h-2 bg-black/40 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-green-500" style={{width: `${Math.min(100, (m.current/m.target)*100)}%`}}></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-yellow-400 font-bold text-sm">+{m.reward}💰</div>
                                    {m.completed && <div className="text-green-400 text-xs font-bold">¡COMPLETADO!</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">🏆 Logros</h3>
                    <div className="space-y-3">
                        {achievements.map(a => (
                            <div key={a.id} className={`p-3 rounded-lg border ${a.unlocked ? 'bg-purple-500/20 border-purple-500' : 'bg-black/20 border-white/10'}`}>
                                <div className="flex justify-between">
                                    <div className="text-white font-bold">{a.title}</div>
                                    {a.unlocked ? <span className="text-green-400">✅</span> : <span className="text-white/30">🔒</span>}
                                </div>
                                <div className="text-white/60 text-xs">{a.description}</div>
                                <div className="text-yellow-400 text-xs mt-1">Premio: {a.reward}💰</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onMenu} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl mb-10">CERRAR</button>
            </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto">
          <div className="mb-8 text-center relative group">
            <h1 className="relative text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-200 drop-shadow-xl italic transform -skew-x-6 pb-2">
              Fly!
            </h1>
            <p className="text-white mt-2 text-xl tracking-[0.5em] font-light">PAPER PLANE</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs z-10">
            {highScore > 0 && (
              <div className="text-center mb-2">
                <span className="text-white/80 text-sm font-bold tracking-widest uppercase">Mejor Puntuación</span>
                <div className="text-4xl font-black text-white">{highScore}</div>
              </div>
            )}

            <button 
              onClick={onStart}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-2xl shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transform hover:scale-105 transition-all"
            >
              DESPEGAR
            </button>

            {/* PRE-FLIGHT BOOSTS */}
            <div className="flex justify-center gap-2 py-2">
                {BOOSTS.map(boost => {
                    const count = boostInventory[boost.id] || 0;
                    const isActive = activeBoosts.includes(boost.id);
                    return (
                        <button 
                            key={boost.id}
                            onClick={() => onToggleBoost(boost.id)}
                            disabled={count === 0 && !isActive}
                            className={`
                                relative w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all
                                ${isActive ? 'bg-yellow-400/80 border-yellow-200 scale-110 shadow-lg' : 'bg-black/40 border-white/10'}
                                ${count === 0 && !isActive ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10'}
                            `}
                        >
                            {boost.icon}
                            {count > 0 && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                                    {count}
                                </div>
                            )}
                            {isActive && (
                                <div className="absolute -bottom-1 -right-1 text-[10px]">✅</div>
                            )}
                        </button>
                    )
                })}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                onClick={onOpenShop}
                className="py-3 bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                >
                <span>🛒</span> HANGAR
                </button>

                <button 
                onClick={onOpenMissions}
                className="py-3 bg-purple-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
                >
                <span>📜</span> MISIONES
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-red-900/80 pointer-events-auto z-50">
          <h2 className="text-6xl font-black text-white drop-shadow-md mb-2 italic">DERRIBADO</h2>
          
          <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/20 shadow-2xl w-full max-w-sm text-center mb-8 relative">
            {isNewRecord && (
              <div className="absolute top-0 left-0 w-full bg-yellow-400 text-yellow-900 font-bold text-xs py-1 animate-pulse">
                ¡NUEVO RÉCORD!
              </div>
            )}
            <div className="mb-6 mt-2">
              <div className="text-blue-100 text-sm font-bold uppercase tracking-widest">Puntuación</div>
              <div className="text-6xl font-black text-white">{Math.floor(score)}</div>
            </div>
            <div className="flex justify-center items-center gap-2 text-yellow-300 bg-black/20 rounded-lg py-2">
              <span>+ {coinsCollectedInRun}</span>
              <span>💰</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={() => onRevive('ad')}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-lg shadow-lg border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
            >
              <span>🎬</span> REVIVIR (ANUNCIO)
            </button>
            
            <button 
              onClick={() => onRevive('coins')}
              disabled={coins < 200}
              className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 ${coins >= 200 ? 'bg-yellow-500 border-yellow-700 text-yellow-900 hover:bg-yellow-400' : 'bg-gray-600 border-gray-700 text-gray-400 opacity-50'}`}
            >
              <span>💰</span> REVIVIR (200)
            </button>

            <button 
              onClick={onRestart}
              className="w-full py-4 bg-white text-red-600 hover:bg-gray-100 rounded-xl font-black text-xl shadow-xl mt-4"
            >
              REINTENTAR
            </button>
            <button 
              onClick={onMenu}
              className="w-full py-3 bg-black/30 text-white hover:bg-black/50 rounded-xl font-bold"
            >
              MENÚ PRINCIPAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};