
import React, { useState } from 'react';
import { GameState, PowerUpType, SkyState, Mission, Achievement, BoostType, MusicTrack, LeaderboardEntry, GameMode } from '../types';
import { POWERUP_LABELS, POWERUP_COLORS, BOOSTS, MUSIC_PLAYLIST } from '../constants';

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
  
  // Music Props
  musicCurrentTrackIndex: number;
  musicIsPlaying: boolean;
  musicIsShuffle: boolean;
  musicIsLoop: boolean;
  onMusicPlayPause: () => void;
  onMusicNext: () => void;
  onMusicPrev: () => void;
  onMusicSelect: (index: number) => void;
  onMusicToggleShuffle: () => void;
  onMusicToggleLoop: () => void;
  
  // Volume Props
  musicVolume: number;
  setMusicVolume: (vol: number) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;

  // Leaderboard Props
  leaderboard: LeaderboardEntry[];
  playerName: string;
  setPlayerName: (name: string) => void;
  
  // Codes Props
  onRedeemCode: (code: string) => { success: boolean; message: string; type?: 'poem' | 'reward' };

  // New Game Mode Props
  gameMode: GameMode;
  onCycleMode: (dir: 1 | -1) => void;
  revivesUsed: number;
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
  onToggleBoost,
  musicCurrentTrackIndex,
  musicIsPlaying,
  musicIsShuffle,
  musicIsLoop,
  onMusicPlayPause,
  onMusicNext,
  onMusicPrev,
  onMusicSelect,
  onMusicToggleShuffle,
  onMusicToggleLoop,
  musicVolume,
  setMusicVolume,
  sfxVolume,
  setSfxVolume,
  leaderboard,
  playerName,
  setPlayerName,
  onRedeemCode,
  gameMode,
  onCycleMode,
  revivesUsed
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'ranking' | 'codes'>('audio');
  const [codeInput, setCodeInput] = useState('');
  const [codeMessage, setCodeMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showPoem, setShowPoem] = useState(false);
  const isNewRecord = score > highScore && highScore > 0;

  const renderSkyIcon = () => {
      switch(skyState) {
          case SkyState.DAY: return '☀️';
          case SkyState.SUNSET: return '🌅';
          case SkyState.PURPLE_SUNSET: return '🌆';
          case SkyState.NIGHT: return '🌙';
          case SkyState.STORM: return '⛈️';
          case SkyState.SNOW: return '❄️';
          case SkyState.AUTO: return '🔄';
      }
  };

  const getModeLabel = (mode: GameMode) => {
      switch(mode) {
          case GameMode.NORMAL: return 'NORMAL';
          case GameMode.COMPETITION: return 'COMPETICIÓN';
          case GameMode.CHILL: return 'CHILL';
      }
  };

  const handleRedeem = () => {
      if (!codeInput.trim()) return;
      const result = onRedeemCode(codeInput.trim());
      if (result.success) {
          setCodeMessage({ text: result.message, type: 'success' });
          if (result.type === 'poem') { setShowPoem(true); setShowSettings(false); }
          setCodeInput('');
      } else { setCodeMessage({ text: result.message, type: 'error' }); }
      setTimeout(() => setCodeMessage(null), 3000);
  };

  const currentTrack = MUSIC_PLAYLIST[musicCurrentTrackIndex];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 font-fredoka select-none overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none z-[60]">
        <div className="pointer-events-auto flex gap-2">
          {(gameState === GameState.MENU || gameState === GameState.PAUSED) && (
            <button onClick={() => setShowSettings(true)} className="p-3 rounded-full shadow-lg border-2 flex items-center justify-center w-12 h-12 bg-white/20 border-white/50 text-white backdrop-blur-md hover:bg-white/30 transition-colors"> ⚙️ </button>
          )}
          {gameState === GameState.PLAYING && (
            <button onClick={onPause} className="p-3 rounded-full shadow-lg border-2 flex items-center justify-center w-12 h-12 bg-white/20 border-white/50 text-white backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /> </svg>
            </button>
          )}
        </div>
        <div className="pointer-events-auto">
          <button onClick={toggleSkyState} className="p-3 rounded-full shadow-lg border-2 w-12 h-12 flex items-center justify-center bg-white/20 border-white/50 backdrop-blur-md text-2xl hover:bg-white/30 transition-colors"> {renderSkyIcon()} </button>
        </div>
      </div>

      {gameState === GameState.PLAYING && (
        <>
          <div className="flex justify-between items-start w-full mt-20">
            <div className="flex flex-col gap-1 pointer-events-auto">
              <div className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] italic"> {Math.floor(score)} </div>
              <div className="text-sm font-bold text-white/60 tracking-wider">METROS - {getModeLabel(gameMode)}</div>
              {streak > 0 && <div className="mt-1 text-yellow-300 font-bold text-xs animate-pulse">🔥 RACHA x{streak}</div>}
              {gameMode === GameMode.COMPETITION && <div className="mt-1 text-red-400 font-bold text-[10px] uppercase">VIDAS: {3 - revivesUsed}</div>}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md pointer-events-auto bg-black/20 border-white/20">
              <span className="text-2xl">💰</span> <span className="text-xl font-bold text-yellow-400">{coinsCollectedInRun}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-start mt-auto mb-20 pointer-events-auto">
            {activePowerUps.map((type) => (
              <div key={type} className="px-4 py-2 rounded-lg font-bold text-white text-sm shadow-lg flex items-center gap-2 animate-pulse" style={{ backgroundColor: POWERUP_COLORS[type] }}>
                {type === PowerUpType.SHIELD && <span>🛡️</span>} {type === PowerUpType.SPEED && <span>🚀</span>} {type === PowerUpType.MAGNET && <span>🧲</span>} {type === PowerUpType.SHOCKWAVE && <span>💥</span>} {type === PowerUpType.ALLIES && <span>✈️</span>} {POWERUP_LABELS[type]}
              </div>
            ))}
          </div>
        </>
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-black/60 pointer-events-auto z-50">
          <h2 className="text-6xl font-black text-white drop-shadow-lg mb-8 italic tracking-widest">PAUSA</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={onResume} className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-2xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"> CONTINUAR </button>
            <button onClick={onMenu} className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xl backdrop-blur-sm transition-all"> MENÚ </button>
          </div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50">
          <div className="mb-8 text-center animate-bounce-slow">
            <h1 className="text-8xl font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] italic tracking-tighter transform -skew-x-6"> FLY! </h1>
            <p className="mt-2 text-blue-200 font-bold tracking-[0.5em] text-sm shadow-black drop-shadow-md">PAPER PLANE</p>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <button onClick={() => onCycleMode(-1)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all active:scale-90"> ◀ </button>
            <div className="text-center bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] min-w-[180px]">
                <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1">RÉCORD {getModeLabel(gameMode)}</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{highScore}</p>
            </div>
            <button onClick={() => onCycleMode(1)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all active:scale-90"> ▶ </button>
          </div>

          <div className="mb-6 w-full max-w-sm px-4">
              <p className="text-center text-cyan-200/60 text-[10px] font-bold mb-3 uppercase tracking-widest">SISTEMAS PRE-VUELO</p>
              <div className="flex justify-center gap-4">
                  {BOOSTS.map(boost => {
                      const count = boostInventory[boost.id] || 0, isActive = activeBoosts.includes(boost.id), hasStock = count > 0;
                      return (
                          <button key={boost.id} onClick={() => onToggleBoost(boost.id)} disabled={!hasStock} className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300 ${isActive ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110 z-10' : hasStock ? 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5' : 'bg-black/60 border-white/5 opacity-40 grayscale'}`}>
                              {boost.icon} <div className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border ${hasStock ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-gray-700 text-gray-400 border-gray-600'}`}> {count} </div>
                          </button>
                      );
                  })}
              </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs px-6">
            <button onClick={onStart} className="group relative w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-full font-black text-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105 active:scale-95 border-4 border-green-300/30"> <span className="drop-shadow-md tracking-wider">DESPEGAR</span> </button>
            <button onClick={onOpenShop} className="w-full py-4 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl font-bold text-lg shadow-lg border border-purple-500/30 backdrop-blur-sm flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"> <span>HANGAR</span> <span className="bg-black/40 px-3 py-1 rounded-full text-xs font-mono text-yellow-300 border border-yellow-500/20">💰 {coins}</span> </button>
            <button onClick={onOpenMissions} className="w-full py-4 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg border border-indigo-400/30 backdrop-blur-sm flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"> <span>📜 MISIONES Y LOGROS</span> </button>
          </div>
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50 bg-red-900/80 backdrop-blur-md">
          <div className="text-center mb-8 animate-bounce-short">
             {isNewRecord ? ( <> <h2 className="text-5xl font-black text-yellow-300 drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] mb-2 italic">¡NUEVO RÉCORD!</h2> <p className="text-white text-xl">¡Impresionante piloto!</p> </> ) : ( <> <h2 className="text-6xl font-black text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] mb-2 italic">GAME OVER</h2> <p className="text-white/80 text-xl">¿Eso es todo lo que tienes?</p> </> )}
          </div>
          <div className="bg-black/40 p-6 rounded-3xl backdrop-blur-sm border border-white/10 w-full max-w-xs mb-8 text-center uppercase">
            <p className="text-cyan-300 text-xs font-bold mb-4 tracking-widest">{getModeLabel(gameMode)}</p>
            <div className="flex justify-between items-end mb-2"> <span className="text-white/60 font-bold">PUNTUACIÓN</span> <span className="text-3xl font-black text-white">{Math.floor(score)}</span> </div>
            <div className="w-full h-px bg-white/10 mb-2"></div>
            <div className="flex justify-between items-end"> <span className="text-white/60 font-bold">MONEDAS</span> <span className="text-2xl font-bold text-yellow-400">+{coinsCollectedInRun}</span> </div>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {!(gameMode === GameMode.COMPETITION && revivesUsed >= 3) && (
                <button onClick={() => onRevive('ad')} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-black text-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 animate-pulse">
                    <span>REVIVIR {gameMode === GameMode.COMPETITION && `(${3-revivesUsed})`}</span> 🎬
                </button>
            )}
            <button onClick={onRestart} className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xl shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"> REINTENTAR </button>
            <button onClick={onMenu} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg backdrop-blur-sm"> MENÚ PRINCIPAL </button>
          </div>
        </div>
      )}

      {gameState === GameState.MISSIONS && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50 bg-slate-900/95 backdrop-blur-xl p-4 touch-action-pan-y overflow-y-auto">
              <div className="w-full max-w-2xl bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl mt-10 mb-10">
                  <div className="flex justify-between items-center mb-6"> <h2 className="text-3xl font-bold text-white">Misiones y Logros</h2> <button onClick={onMenu} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20">✕</button> </div>
                  <div className="mb-8"> <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">📅 Misiones Diarias</h3> <div className="space-y-3"> {missions.map(m => ( <div key={m.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center"> <div className="flex-1"> <p className="text-white font-bold">{m.description}</p> <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden"> <div className="bg-blue-500 h-full transition-all" style={{width: `${Math.min(100, (m.current/m.target)*100)}%`}}></div> </div> <p className="text-xs text-white/50 mt-1">{m.current} / {m.target}</p> </div> <div className="ml-4 flex flex-col items-end"> {m.completed ? ( <span className="text-green-400 font-bold text-sm">✓ COMPLETADO</span> ) : ( <span className="text-yellow-400 font-bold text-sm">+{m.reward} 💰</span> )} </div> </div> ))} </div> </div>
                  <div> <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">🏆 Logros</h3> <div className="space-y-3"> {achievements.map(a => ( <div key={a.id} className={`p-4 rounded-xl border flex justify-between items-center ${a.unlocked ? 'bg-purple-500/20 border-purple-500/50' : 'bg-black/20 border-white/5 opacity-70'}`}> <div> <h4 className={`font-bold ${a.unlocked ? 'text-white' : 'text-white/50'}`}>{a.title}</h4> <p className="text-sm text-white/60">{a.description}</p> </div> <div className="ml-4"> {a.unlocked ? ( <span className="text-purple-300 font-bold text-xs bg-purple-500/20 px-2 py-1 rounded">DESBLOQUEADO</span> ) : ( <span className="text-white/40 font-bold text-sm">🔒 {a.reward} 💰</span> )} </div> </div> ))} </div> </div>
                  <button onClick={onMenu} className="mt-8 w-full py-4 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold text-xl shadow-lg transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1"> VOLVER AL MENÚ </button>
              </div>
          </div>
      )}

      {showPoem && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[80] bg-black/95 backdrop-blur-xl p-6">
              <div className="w-full max-w-lg p-8 rounded-3xl relative border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] text-center animate-fade-in overflow-y-auto max-h-full">
                  <h2 className="text-3xl font-serif text-pink-300 mb-6 italic">Con locura, te quiero</h2>
                  <div className="text-white/90 font-serif leading-relaxed space-y-4 text-lg whitespace-pre-line opacity-90"> {`Te quiero.\nDos palabras, ocho letras... (truncado por brevedad)`} </div>
                  <button onClick={() => setShowPoem(false)} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-serif italic transition-all"> Cerrar </button>
              </div>
          </div>
      )}

      {showSettings && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[70] bg-black/80 backdrop-blur-xl p-4">
              <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-white/10 p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold text-white flex items-center gap-2">⚙️ Ajustes</h2> <button onClick={() => setShowSettings(false)} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 font-bold"> ✕ </button> </div>
                  <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                      <button onClick={() => setSettingsTab('audio')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'audio' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}> 🎵 Sonido </button>
                      <button onClick={() => setSettingsTab('ranking')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'ranking' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}> 🏆 Ranking </button>
                      <button onClick={() => setSettingsTab('codes')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'codes' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}> 🔐 Códigos </button>
                  </div>
                  {settingsTab === 'audio' && (
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 animate-fade-in">
                      <div className="mb-6 space-y-4">
                          <div> <div className="flex justify-between text-xs font-bold text-white/70 mb-1"> <span>VOLUMEN MÚSICA</span> <span>{Math.round(musicVolume * 100)}%</span> </div> <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                          <div> <div className="flex justify-between text-xs font-bold text-white/70 mb-1"> <span>VOLUMEN EFECTOS</span> <span>{Math.round(sfxVolume * 100)}%</span> </div> <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                      </div>
                      <div className="w-full h-px bg-white/10 mb-6"></div>
                      <div className="bg-white/5 rounded-xl p-3 mb-4 flex flex-col items-center"> <p className="text-xs text-white/50 mb-1 tracking-widest uppercase">REPRODUCIENDO</p> <p className="text-cyan-300 font-bold text-center truncate w-full">{currentTrack?.title || 'Selecciona una canción'}</p> </div>
                      <div className="flex justify-center items-center gap-4 mb-6"> <button onClick={onMusicPrev} className="text-2xl text-white/70 hover:text-white">⏮️</button> <button onClick={onMusicPlayPause} className="w-14 h-14 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center text-white shadow-lg text-2xl"> {musicIsPlaying ? '⏸️' : '▶️'} </button> <button onClick={onMusicNext} className="text-2xl text-white/70 hover:text-white">⏭️</button> </div>
                      <div className="flex justify-between gap-2 mb-4">
                          <button onClick={onMusicToggleLoop} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${musicIsLoop ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-white/5 border-white/10 text-white/50'}`}> 🔁 BUCLE: {musicIsLoop ? 'ON' : 'OFF'} </button>
                          <button onClick={onMusicToggleShuffle} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${musicIsShuffle ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-white/50'}`}> 🔀 ALEATORIO: {musicIsShuffle ? 'ON' : 'OFF'} </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar"> {MUSIC_PLAYLIST.map((track, idx) => ( <button key={idx} onClick={() => onMusicSelect(idx)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${musicCurrentTrackIndex === idx ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:bg-white/10'}`}> <span className="truncate">{track.title}</span> {musicCurrentTrackIndex === idx && musicIsPlaying && <span className="text-[10px] animate-pulse">▶</span>} </button> ))} </div>
                  </div>
                  )}
                  {settingsTab === 'ranking' && (
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 animate-fade-in">
                      <div className="mb-6"> <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">TU NOMBRE</label> <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400 w-full" placeholder="Piloto" /> </div>
                      <div className="mb-2 flex justify-between items-end"> <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">🏆 Tu Top 10</h3> </div>
                      <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5"> <table className="w-full text-sm"> <thead> <tr className="bg-white/5 text-white/50 text-xs"> <th className="p-2 text-left w-8">#</th> <th className="p-2 text-left">Piloto</th> <th className="p-2 text-right">Puntos</th> </tr> </thead> <tbody> {leaderboard.length === 0 ? ( <tr> <td colSpan={3} className="p-4 text-center text-white/30 text-xs italic"> Juega para registrar tu primer récord. </td> </tr> ) : ( leaderboard.map((entry, index) => ( <tr key={index} className={`border-b border-white/5 ${entry.name === playerName ? 'bg-cyan-500/20 text-cyan-200 font-bold' : 'text-white/80'}`}> <td className="p-2 w-8 text-center">{index + 1}</td> <td className="p-2">{entry.name}</td> <td className="p-2 text-right">{entry.score}</td> </tr> )) )} </tbody> </table> </div>
                  </div>
                  )}
                  {settingsTab === 'codes' && (
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/5 animate-fade-in flex flex-col items-center">
                          <div className="mb-6 text-center"> <div className="text-4xl mb-2">🔐</div> <h3 className="text-white font-bold text-lg">CÓDIGOS SECRETOS</h3> <p className="text-white/50 text-xs mt-1">Introduce un código para desbloquear contenido especial.</p> </div>
                          <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-green-400 placeholder-white/20 text-center uppercase mb-4" placeholder="CÓDIGO" />
                          <button onClick={handleRedeem} className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"> CANJEAR </button>
                          {codeMessage && <div className={`mt-4 text-sm font-bold text-center animate-fade-in ${codeMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}> {codeMessage.text} </div>}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
