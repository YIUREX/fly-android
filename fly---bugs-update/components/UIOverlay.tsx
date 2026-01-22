
import React, { useState, useMemo, useEffect } from 'react';
import { GameState, PowerUpType, SkyState, Mission, Achievement, BoostType, MusicTrack, LeaderboardEntry, GameMode, GameStats, EpicRank } from '../types';
import { POWERUP_LABELS, POWERUP_COLORS, BOOSTS, MUSIC_PLAYLIST, EPIC_RANKS } from '../constants';

// --- SUB-COMPONENTE: ICONO DE RADAR ---
const RadarIcon: React.FC = () => (
    <div className="relative w-7 h-7 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-cyan-500/50 rounded-full"></div>
        <div className="absolute inset-1 border border-cyan-500/30 rounded-full"></div>
        <div className="absolute w-full h-full rounded-full border-t-2 border-cyan-400 animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]"></div>
    </div>
);

// --- SUB-COMPONENTE: INSIGNIA DE RANGO (SVG) ---
const RankBadge: React.FC<{ rank: EpicRank, size?: number, locked?: boolean }> = ({ rank, size = 64, locked = false }) => {
    const isMax = rank.level === 10;
    
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            className={`drop-shadow-lg transition-all duration-500 ${locked ? 'grayscale opacity-30 scale-90' : 'scale-100'}`}
        >
            <defs>
                <linearGradient id={`grad-${rank.level}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={rank.color} />
                    <stop offset="100%" stopColor={rank.level >= 8 ? "#fff" : "#000"} stopOpacity="0.5" />
                </linearGradient>
                <filter id={`glow-${rank.level}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <g filter={!locked && rank.level >= 6 ? `url(#glow-${rank.level})` : ""}>
                {rank.level <= 3 && (
                    <path d="M50 10 L80 40 L50 90 L20 40 Z" fill={`url(#grad-${rank.level})`} stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                )}
                {rank.level >= 4 && rank.level <= 6 && (
                    <>
                        <path d="M20 30 Q50 20 80 30 L80 60 Q50 85 20 60 Z" fill={`url(#grad-${rank.level})`} />
                        <path d="M10 40 L30 40 L20 55 Z" fill={rank.color} opacity="0.6" />
                        <path d="M90 40 L70 40 L80 55 Z" fill={rank.color} opacity="0.6" />
                    </>
                )}
                {rank.level >= 7 && (
                    <>
                        <circle cx="50" cy="50" r="35" fill="none" stroke={rank.color} strokeWidth="2" strokeDasharray="5,3" className={!locked && isMax ? "animate-spin-slow" : ""} />
                        <path d="M50 5 L95 50 L50 95 L5 50 Z" fill={`url(#grad-${rank.level})`} />
                        <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="white" opacity="0.3" />
                        {!locked && isMax && <circle cx="50" cy="50" r="10" fill="white" className="animate-pulse" />}
                    </>
                )}
                <text x="50" y="58" textAnchor="middle" fill={rank.level >= 8 ? "#000" : "#fff"} fontSize="16" fontWeight="900" style={{fontFamily: 'monospace'}}>{rank.level}</text>
            </g>
        </svg>
    );
};

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
  musicVolume: number;
  setMusicVolume: (vol: number) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  leaderboard: LeaderboardEntry[];
  playerName: string;
  setPlayerName: (name: string) => void;
  stats: GameStats;
  onRedeemCode: (code: string) => { success: boolean; message: string; type?: 'poem' | 'reward' };
  gameMode: GameMode;
  onCycleMode: (dir: 1 | -1) => void;
  revivesUsed: number;
  isWatchingAd: boolean;
  onTutorialComplete?: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState, score, highScore, coins, coinsCollectedInRun, activePowerUps, onStart, onOpenShop, onRestart, onMenu, onPause, onResume, skyState, toggleSkyState, onRevive, onOpenMissions, missions, achievements, streak, boostInventory, activeBoosts, onToggleBoost, musicCurrentTrackIndex, musicIsPlaying, musicIsShuffle, musicIsLoop, onMusicPlayPause, onMusicNext, onMusicPrev, onMusicSelect, onMusicToggleShuffle, onMusicToggleLoop, musicVolume, setMusicVolume, sfxVolume, setSfxVolume, leaderboard, playerName, setPlayerName, onRedeemCode, gameMode, onCycleMode, revivesUsed, isWatchingAd, stats, onTutorialComplete
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'stats' | 'codes'>('audio');
  const [codeInput, setCodeInput] = useState('');
  const [codeMessage, setCodeMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showPoem, setShowPoem] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const isNewRecord = score > highScore && highScore > 0;

  const currentRankInfo = useMemo(() => {
    let current = EPIC_RANKS[0];
    let next = EPIC_RANKS[1];
    for (let i = 0; i < EPIC_RANKS.length; i++) {
        if (stats.totalScore >= EPIC_RANKS[i].minScore) {
            current = EPIC_RANKS[i];
            next = EPIC_RANKS[i+1] || EPIC_RANKS[i];
        } else { break; }
    }
    const range = next.minScore - current.minScore;
    const progress = range > 0 ? ((stats.totalScore - current.minScore) / range) * 100 : 100;
    return { current, next, progress: Math.min(100, progress) };
  }, [stats.totalScore]);

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

  // --- TUTORIAL CONTENT ---
  const tutorialSteps = [
    {
      title: "BIENVENIDO, PILOTO",
      desc: "Soy tu asistente de vuelo. Antes de despegar, vamos a revisar los sistemas fundamentales de tu avión de papel.",
      highlight: null,
      location: "Centro de mando"
    },
    {
      title: "SISTEMAS DE VUELO",
      desc: "Para maniobrar, arrastra el dedo o el ratón por el CENTRO DE LA PANTALLA. Esquiva los misiles entrantes y recoge monedas para mejorar tu arsenal.",
      highlight: "screen",
      location: "Área de maniobras"
    },
    {
      title: "CABINA DE CONTROL",
      desc: "Ubicada en la ESQUINA SUPERIOR IZQUIERDA. Este es el corazón de tu avión: gestiona la MÚSICA, consulta tu RANGO militar y analiza las ESTADÍSTICAS de vuelo.",
      highlight: "cabina",
      location: "Esquina superior izquierda"
    },
    {
      title: "EL HANGAR",
      desc: "En el BOTÓN PÚRPURA inferior encontrarás el Hangar. Úsalo para comprar nuevas skins, modelos de aviones y estelas con tus monedas acumuladas.",
      highlight: "hangar",
      location: "Panel central inferior"
    },
    {
      title: "COMANDO ATMOSFÉRICO",
      desc: "En la ESQUINA SUPERIOR DERECHA. Puedes cambiar el fondo y el clima para ajustar la visibilidad según tu preferencia táctica.",
      highlight: "sky",
      location: "Esquina superior derecha"
    },
    {
      title: "PROTOCOLO DE MISIÓN",
      desc: "Usa el PANEL CENTRAL para cambiar de modo: NORMAL, COMPETICIÓN (3 vidas) o CHILL (vuelo relajado sin enemigos).",
      highlight: "modes",
      location: "Panel central de récords"
    }
  ];

  const nextTutorial = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(s => s + 1);
    } else {
      onTutorialComplete?.();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 font-fredoka select-none overflow-hidden">
      
      {isWatchingAd && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[100] pointer-events-auto backdrop-blur-md">
              <div className="text-6xl animate-spin mb-6">🎞️</div>
              <h2 className="text-3xl font-black text-white italic tracking-widest animate-pulse">CARGANDO ANUNCIO...</h2>
              <p className="text-white/40 mt-2 text-sm uppercase font-bold">Espera mientras se procesa el anuncio</p>
          </div>
      )}

      {/* --- OVERLAY OSCURO PARA TUTORIAL --- */}
      {gameState === GameState.TUTORIAL && (
        <div className="absolute inset-0 bg-black/85 z-[70] pointer-events-auto transition-opacity duration-500"></div>
      )}

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none z-[80]">
        <div className="pointer-events-auto flex gap-2">
          {(gameState === GameState.MENU || gameState === GameState.PAUSED || gameState === GameState.TUTORIAL) && (
            <button 
                onClick={() => setShowSettings(true)} 
                id="tutorial-cabina"
                className={`group relative p-3 rounded-full shadow-lg border-2 flex items-center justify-center w-14 h-14 bg-black/40 border-cyan-500/50 text-white backdrop-blur-md hover:bg-cyan-500/20 transition-all hover:scale-110 active:scale-95 overflow-hidden ${gameState === GameState.TUTORIAL && tutorialSteps[tutorialStep].highlight === 'cabina' ? 'relative z-[100] ring-4 ring-cyan-400 animate-pulse scale-125 bg-cyan-900 shadow-[0_0_30px_rgba(34,211,238,0.8)]' : ''}`}
                title="CABINA"
            >
                <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>
                <RadarIcon />
            </button>
          )}
          {gameState === GameState.PLAYING && (
            <button onClick={onPause} className="p-3 rounded-full shadow-lg border-2 flex items-center justify-center w-14 h-14 bg-white/20 border-white/50 text-white backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /> </svg>
            </button>
          )}
        </div>
        <div className="pointer-events-auto">
          <button 
            onClick={toggleSkyState} 
            id="tutorial-sky"
            className={`p-3 rounded-full shadow-lg border-2 w-14 h-14 flex items-center justify-center bg-white/20 border-white/50 backdrop-blur-md text-2xl hover:bg-white/30 transition-colors ${gameState === GameState.TUTORIAL && tutorialSteps[tutorialStep].highlight === 'sky' ? 'relative z-[100] ring-4 ring-white animate-pulse scale-125 bg-white/40 shadow-[0_0_30px_rgba(255,255,255,0.8)]' : ''}`}
          > 
            {renderSkyIcon()} 
          </button>
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

      {(gameState === GameState.MENU || gameState === GameState.TUTORIAL) && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50 transition-all duration-700 ${gameState === GameState.TUTORIAL ? 'opacity-100' : ''}`}>
          <div className={`mb-8 text-center animate-bounce-slow transition-opacity ${gameState === GameState.TUTORIAL && tutorialSteps[tutorialStep].highlight !== null ? 'opacity-10' : 'opacity-100'}`}>
            <h1 className="text-8xl font-black text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] italic tracking-tighter transform -skew-x-6"> FLY! </h1>
            <p className="mt-2 text-blue-200 font-bold tracking-[0.5em] text-sm shadow-black drop-shadow-md">PAPER PLANE</p>
          </div>

          <div 
            id="tutorial-modes"
            className={`mb-6 flex items-center gap-4 transition-all ${gameState === GameState.TUTORIAL && tutorialSteps[tutorialStep].highlight === 'modes' ? 'relative z-[100] scale-110 bg-cyan-950/60 p-4 rounded-3xl ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.5)]' : gameState === GameState.TUTORIAL ? 'opacity-5 grayscale' : ''}`}
          >
            <button onClick={() => onCycleMode(-1)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all active:scale-90"> ◀ </button>
            <div className="text-center bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] min-w-[180px]">
                <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1">RÉCORD {getModeLabel(gameMode)}</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{highScore}</p>
            </div>
            <button onClick={() => onCycleMode(1)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all active:scale-90"> ▶ </button>
          </div>

          <div className={`mb-6 w-full max-w-sm px-4 transition-opacity ${gameState === GameState.TUTORIAL ? 'opacity-5 grayscale' : 'opacity-100'}`}>
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
            <button onClick={onStart} className={`group relative w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-full font-black text-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105 active:scale-95 border-4 border-green-300/30 ${gameState === GameState.TUTORIAL ? 'opacity-5 grayscale' : 'opacity-100'}`}> <span className="drop-shadow-md tracking-wider">DESPEGAR</span> </button>
            <button 
                onClick={onOpenShop} 
                id="tutorial-hangar"
                className={`w-full py-4 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl font-bold text-lg shadow-lg border border-purple-500/30 backdrop-blur-sm flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] ${gameState === GameState.TUTORIAL && tutorialSteps[tutorialStep].highlight === 'hangar' ? 'relative z-[100] ring-4 ring-purple-400 animate-pulse scale-110 bg-purple-700 shadow-[0_0_40px_rgba(168,85,247,0.8)]' : gameState === GameState.TUTORIAL ? 'opacity-5 grayscale' : ''}`}
            > 
                <span>HANGAR</span> <span className="bg-black/40 px-3 py-1 rounded-full text-xs font-mono text-yellow-300 border border-yellow-500/20">💰 {coins}</span> 
            </button>
            <button onClick={onOpenMissions} className={`w-full py-4 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg border border-indigo-400/30 backdrop-blur-sm flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] ${gameState === GameState.TUTORIAL ? 'opacity-5 grayscale' : 'opacity-100'}`}> <span>📜 MISIONES Y LOGROS</span> </button>
          </div>
        </div>
      )}

      {/* --- TUTORIAL OVERLAY (DIÁLOGOS) --- */}
      {gameState === GameState.TUTORIAL && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex items-end justify-center pb-12 md:pb-24 px-6">
            <div className="w-full max-w-md bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,0,0,1)] animate-fade-in pointer-events-auto border-t-cyan-400">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase italic">FASE DE INDUCCIÓN {tutorialStep + 1}/{tutorialSteps.length}</span>
                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{tutorialSteps[tutorialStep].location}</span>
                    </div>
                    <RadarIcon />
                </div>
                <h3 className="text-2xl font-black text-white italic mb-3 tracking-tighter uppercase text-left">{tutorialSteps[tutorialStep].title}</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-8 text-left">{tutorialSteps[tutorialStep].desc}</p>
                
                {tutorialSteps[tutorialStep].highlight === 'screen' && (
                    <div className="flex flex-col items-center mb-8 gap-2 bg-black/40 py-4 rounded-2xl border border-white/5">
                        <div className="w-40 h-20 border-2 border-cyan-500/20 rounded-2xl relative overflow-hidden bg-white/5">
                            <div className="absolute top-1/2 left-4 w-8 h-8 bg-cyan-400/30 rounded-full animate-drag-x"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-cyan-400/20">SISTEMA GIROSCÓPICO</div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={nextTutorial}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xl rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all active:scale-95 border-b-4 border-blue-900"
                >
                    {tutorialStep < tutorialSteps.length - 1 ? "ENTERADO, SIGUIENTE" : "¡LISTO PARA EL COMBATE!"}
                </button>
            </div>
        </div>
      )}

      {/* --- RESTO DE COMPONENTES DE UI --- */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-black/60 pointer-events-auto z-50">
          <h2 className="text-6xl font-black text-white drop-shadow-lg mb-8 italic tracking-widest">PAUSA</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={onResume} className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-2xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"> CONTINUAR </button>
            <button onClick={onMenu} className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xl backdrop-blur-sm transition-all"> MENÚ </button>
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
                <button 
                  onClick={() => onRevive('ad')} 
                  disabled={isWatchingAd}
                  className={`w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-black text-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 ${isWatchingAd ? 'opacity-50' : 'animate-pulse'}`}
                >
                    <span>REVIVIR {gameMode === GameMode.COMPETITION && `(${3-revivesUsed})`}</span> 🎬
                </button>
            )}
            <button onClick={onRestart} disabled={isWatchingAd} className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xl shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"> REINTENTAR </button>
            <button onClick={onMenu} disabled={isWatchingAd} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg backdrop-blur-sm"> MENÚ PRINCIPAL </button>
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

      {showSettings && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[150] bg-black/90 backdrop-blur-xl p-4">
              <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                  <div className="flex justify-between items-center mb-6"> 
                    <div className="flex items-center gap-3">
                        <RadarIcon />
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Cabina de Control</h2> 
                    </div>
                    <button onClick={() => setShowSettings(false)} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 font-bold transition-transform hover:rotate-90"> ✕ </button> 
                  </div>
                  <div className="flex bg-black/50 p-1.5 rounded-2xl mb-6 border border-white/5">
                      <button onClick={() => setSettingsTab('audio')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${settingsTab === 'audio' ? 'bg-cyan-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}> 🎵 Audio </button>
                      <button onClick={() => setSettingsTab('stats')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${settingsTab === 'stats' ? 'bg-cyan-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}> 📊 Telemetría </button>
                      <button onClick={() => setSettingsTab('codes')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${settingsTab === 'codes' ? 'bg-cyan-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}> 🔐 Cifrado </button>
                  </div>
                  {settingsTab === 'audio' && (
                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5 animate-fade-in">
                      <div className="mb-6 space-y-5">
                          <div> <div className="flex justify-between text-[10px] font-black text-white/50 mb-2 uppercase tracking-widest"> <span>Volumen Maestro</span> <span>{Math.round(musicVolume * 100)}%</span> </div> <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                          <div> <div className="flex justify-between text-[10px] font-black text-white/50 mb-2 uppercase tracking-widest"> <span>Sistemas SFX</span> <span>{Math.round(sfxVolume * 100)}%</span> </div> <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500" /> </div>
                      </div>
                      <div className="w-full h-px bg-white/5 mb-6"></div>
                      <div className="bg-cyan-950/20 rounded-xl p-4 mb-5 flex flex-col items-center border border-cyan-500/10"> <p className="text-[9px] text-cyan-500/60 mb-2 tracking-[0.3em] uppercase font-black">Emisor de Radio Activo</p> <p className="text-white font-bold text-center truncate w-full italic">"{currentTrack?.title || 'Buscando señal...'}"</p> </div>
                      <div className="flex justify-center items-center gap-6 mb-6"> <button onClick={onMusicPrev} className="text-2xl opacity-60 hover:opacity-100 transition-opacity">⏮️</button> <button onClick={onMusicPlayPause} className="w-16 h-16 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(8,145,178,0.3)] text-3xl transition-transform active:scale-90"> {musicIsPlaying ? '⏸️' : '▶️'} </button> <button onClick={onMusicNext} className="text-2xl opacity-60 hover:opacity-100 transition-opacity">⏭️</button> </div>
                      <div className="flex justify-between gap-3 mb-5">
                          <button onClick={onMusicToggleLoop} className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${musicIsLoop ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-black/30 border-white/5 text-white/30'}`}> 🔁 Bucle: {musicIsLoop ? 'Activo' : 'Off'} </button>
                          <button onClick={onMusicToggleShuffle} className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${musicIsShuffle ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-black/30 border-white/5 text-white/30'}`}> 🔀 Mix: {musicIsShuffle ? 'Activo' : 'Off'} </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar"> {MUSIC_PLAYLIST.map((track, idx) => ( <button key={idx} onClick={() => onMusicSelect(idx)} className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex justify-between items-center ${musicCurrentTrackIndex === idx ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:bg-white/5'}`}> <span className="truncate">{track.title}</span> {musicCurrentTrackIndex === idx && musicIsPlaying && <span className="text-[10px] animate-pulse">▶</span>} </button> ))} </div>
                  </div>
                  )}
                  {settingsTab === 'stats' && (
                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5 animate-fade-in max-h-[60vh] overflow-y-auto custom-scrollbar">
                      <div className="mb-6"> 
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-2 block">Identificación del Piloto</label> 
                        <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-black focus:outline-none focus:border-cyan-500 transition-all uppercase placeholder-white/20" placeholder="SIN NOMBRE" /> 
                      </div>
                      
                      {/* SECCIÓN DE RANGO ACTUAL */}
                      <div className="bg-gradient-to-b from-white/5 to-transparent rounded-2xl p-5 mb-6 border border-white/10 flex flex-col items-center shadow-inner">
                          <div className="relative mb-3">
                              <div className="absolute inset-0 blur-2xl rounded-full opacity-50" style={{ backgroundColor: currentRankInfo.current.glowColor }}></div>
                              <RankBadge rank={currentRankInfo.current} size={100} />
                          </div>
                          <h3 className="text-xl font-black italic tracking-widest text-white mb-1 uppercase" style={{ color: currentRankInfo.current.color }}>{currentRankInfo.current.name}</h3>
                          <div className="w-full bg-black/80 h-3 rounded-full mt-3 relative overflow-hidden border border-white/5">
                              <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${currentRankInfo.progress}%`, backgroundColor: currentRankInfo.current.color, boxShadow: `0 0 15px ${currentRankInfo.current.color}` }}></div>
                          </div>
                          <div className="flex justify-between w-full mt-2">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Puntos de Honor: {Math.floor(stats.totalScore)}</span>
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Siguiente: {Math.floor(currentRankInfo.next.minScore)}</span>
                          </div>
                      </div>

                      {/* GRID DE ESTADÍSTICAS AMPLIADO */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1">Récord Altura</p>
                            <p className="text-2xl font-black text-white italic">{stats.maxScore}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">Incursiones</p>
                            <p className="text-2xl font-black text-white italic">{stats.gamesPlayed}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mb-1">Honor Total</p>
                            <p className="text-2xl font-black text-white italic">{Math.floor(stats.totalScore)}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-purple-500 font-black uppercase tracking-widest mb-1">Capital</p>
                            <p className="text-2xl font-black text-white italic">{stats.totalCoins}</p>
                        </div>
                        {/* NUEVAS ESTADÍSTICAS DE COMBATE */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1">Esquivados</p>
                            <p className="text-2xl font-black text-white italic">{stats.totalMissilesDodged}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-lg">
                            <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mb-1">Destruidos</p>
                            <p className="text-2xl font-black text-white italic">{stats.missilesDestroyed}</p>
                        </div>
                      </div>

                      {/* SECCIÓN DE RANKING Y CONTACTO */}
                      <div className="mb-6 bg-cyan-950/20 border border-cyan-500/10 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Enlace de Inteligencia Global</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] text-white/30 font-black uppercase mb-1.5 tracking-widest">📡 Ranking en Tiempo Real</p>
                                <a href="https://instagram.com/wewillberichgames" target="_blank" className="text-sm font-black text-white hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                                    <span>@wewillberichgames</span>
                                    <span className="text-[9px] bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-400 opacity-60 group-hover:opacity-100 uppercase">Visitar</span>
                                </a>
                            </div>
                            <div>
                                <p className="text-[9px] text-white/30 font-black uppercase mb-1.5 tracking-widest">📧 Envío de Reportes de Vuelo</p>
                                <p className="text-xs font-bold text-white select-all font-mono">wewillberich.contact@gmail.com</p>
                                <p className="text-[8px] text-cyan-500/40 italic mt-2 font-medium">* Adjunta evidencia visual para validar tu rango en el muro de honor mundial.</p>
                            </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => { setShowSettings(false); setTutorialStep(0); onTutorialComplete?.(); }}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5 transition-all mb-4"
                      >
                        Reiniciar Sistemas de Inducción
                      </button>
                  </div>
                  )}
                  {settingsTab === 'codes' && (
                      <div className="bg-black/40 rounded-2xl p-6 border border-white/5 animate-fade-in flex flex-col items-center">
                          <div className="mb-8 text-center"> 
                            <div className="text-5xl mb-4 animate-float">📟</div> 
                            <h3 className="text-white font-black text-xl uppercase italic tracking-tighter">Protocolos de Cifrado</h3> 
                            <p className="text-white/40 text-xs mt-2 leading-relaxed">Sincroniza códigos de mando para desbloquear suministros tácticos restringidos.</p> 
                          </div>
                          <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-black focus:outline-none focus:border-cyan-500 placeholder-white/10 text-center uppercase mb-6 tracking-[0.3em]" placeholder="INTRODUCIR CÓDIGO" />
                          <button onClick={handleRedeem} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black shadow-lg transition-all active:scale-95 border-b-4 border-cyan-800 uppercase tracking-widest"> Validar Encriptación </button>
                          {codeMessage && <div className={`mt-6 text-xs font-black text-center animate-fade-in uppercase tracking-widest ${codeMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}> {codeMessage.text} </div>}
                      </div>
                  )}
              </div>
          </div>
      )}

      <style>{`
        @keyframes drag-x {
          0%, 100% { transform: translate(0, -50%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; transform: translate(80px, -50%); }
          90% { opacity: 0; }
        }
        .animate-drag-x {
          animation: drag-x 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
