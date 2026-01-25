
import React, { useState, useEffect, useRef } from 'react';
import { PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS, BOOSTS, LOOT_BOX_PRICE } from '../constants';
import { PlaneModel, PlaneSkin, TrailStyle, DeathEffectStyle, BoostItem, LootResult, Rarity } from '../types';
import { getRarityColor, soundManager } from '../utils';

// --- SUB-COMPONENTE PARA PREVISUALIZAR ESTELAS ---
const TrailPreview: React.FC<{ style: TrailStyle, size?: 'small' | 'large' }> = ({ style, size = 'small' }) => {
    const isLarge = size === 'large';
    const color = style.color === 'rainbow' ? 'url(#rainbow-grad)' : style.color;
    const width = isLarge ? 8 : 4;
    const glow = style.glow ? (style.color === 'rainbow' ? '#ff00ff' : style.color) : 'transparent';

    const renderContent = () => {
        const path = "M 5,25 Q 25,5 45,25 T 85,25";
        switch (style.type) {
            case 'bubbles':
                return [10, 30, 50, 70, 90].map((x, i) => (
                    <circle key={i} cx={x} cy={20 + Math.sin(i) * 5} r={2 + i/2} fill={color} />
                ));
            case 'pixel':
                return [10, 25, 40, 55, 70, 85].map((x, i) => (
                    <rect key={i} x={x} y={20 + Math.sin(i) * 3} width={width} height={width} fill={color} />
                ));
            case 'sparkle':
                return [10, 25, 40, 55, 70, 85].map((x, i) => (
                    <g key={i} transform={`translate(${x}, ${25 + Math.cos(i) * 8})`}>
                        <rect x="-2" y="-2" width="4" height="4" fill={color} transform="rotate(45)" />
                        <rect x="-1" y="-4" width="2" height="8" fill="white" opacity="0.5" />
                        <rect x="-4" y="-1" width="8" height="2" fill="white" opacity="0.5" />
                    </g>
                ));
            case 'electric':
                return <path d="M 5,25 L 20,15 L 35,30 L 50,10 L 65,35 L 90,20" fill="none" stroke={color} strokeWidth={width/2} strokeLinecap="round" />;
            default:
                return <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray="none" />;
        }
    };

    return (
        <svg viewBox="0 0 100 50" className={`w-full ${isLarge ? 'h-24' : 'h-8'}`}>
            <defs>
                <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="red" /><stop offset="25%" stopColor="yellow" /><stop offset="50%" stopColor="green" /><stop offset="75%" stopColor="blue" /><stop offset="100%" stopColor="purple" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <g filter={style.glow ? "url(#glow)" : ""} stroke={style.glow ? glow : "none"}>{renderContent()}</g>
        </svg>
    );
};

const EffectPreview: React.FC<{ style: DeathEffectStyle, animate?: boolean }> = ({ style, animate = false }) => {
    const color = style.particleColor === 'random' ? '#ff00ff' : style.particleColor;
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className={`absolute w-4 h-4 rounded-full ${animate ? 'animate-ping' : ''}`} style={{ backgroundColor: color }}></div>
            {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.6, transform: `rotate(${i * 30}deg) translateY(${animate ? '-40px' : '-15px'}) scale(${animate ? 0 : 1})`, transition: animate ? 'all 0.8s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none' }}></div>
            ))}
        </div>
    );
};

interface ShopProps {
  coins: number;
  ownedModels: string[];
  ownedSkins: string[];
  ownedTrails: string[];
  ownedDeathEffects: string[];
  boostInventory: Record<string, number>;
  currentModelId: string;
  currentSkinId: string;
  currentTrailId: string;
  currentDeathEffectId: string;
  onBuy: (type: 'model' | 'skin' | 'trail' | 'effect' | 'boost', id: string, cost: number) => void;
  onEquip: (type: 'model' | 'skin' | 'trail' | 'effect', id: string) => void;
  onBack: () => void;
  onOpenLootBox: () => LootResult | null;
}

type ShopSection = 'market' | 'workshop' | 'loot';
type MarketCategory = 'model' | 'skin' | 'trail' | 'effect' | 'boost';
type LootState = 'idle' | 'dropping' | 'landing' | 'waiting_tap' | 'opening' | 'revealing' | 'revealed';

export const Shop: React.FC<ShopProps> = ({ 
  coins, ownedModels, ownedSkins, ownedTrails, ownedDeathEffects, boostInventory,
  currentModelId, currentSkinId, currentTrailId, currentDeathEffectId, 
  onBuy, onEquip, onBack, onOpenLootBox 
}) => {
  const [activeSection, setActiveSection] = useState<ShopSection>('market');
  const [marketCategory, setMarketCategory] = useState<MarketCategory>('model');
  const [workshopCategory, setWorkshopCategory] = useState<Exclude<MarketCategory, 'boost'>>('model');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Loot States
  const [lootState, setLootState] = useState<LootState>('idle');
  const [lootResult, setLootResult] = useState<LootResult | null>(null);
  const [tapsRemaining, setTapsRemaining] = useState(5);
  const [isShaking, setIsShaking] = useState(false);

  const currentModelData = PLANE_MODELS.find(m => m.id === currentModelId) || PLANE_MODELS[0];

  const handleStartLoot = () => {
    if (coins < LOOT_BOX_PRICE) return;
    setLootState('dropping');
    setTimeout(() => setLootState('landing'), 1500);
    setTimeout(() => setLootState('waiting_tap'), 2200);
  };

  const handleBoxTap = () => {
    if (lootState !== 'waiting_tap') return;
    setIsShaking(true);
    soundManager.playCoin(); // Reutilizamos sonido para feedback
    setTapsRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
            triggerOpen();
            return 5;
        }
        return next;
    });
    setTimeout(() => setIsShaking(false), 100);
  };

  const triggerOpen = () => {
    setLootState('opening');
    soundManager.playExplosion();
    setTimeout(() => {
        const result = onOpenLootBox();
        setLootResult(result);
        setLootState('revealing');
        setTimeout(() => setLootState('revealed'), 800);
    }, 1000);
  };

  const resetLoot = () => {
    setLootState('idle');
    setLootResult(null);
    setTapsRemaining(5);
  };

  const renderItemCard = (item: any, type: MarketCategory, isOwned: boolean, isEquipped: boolean) => {
      const rarityColor = getRarityColor(item.rarity || Rarity.COMMON);
      return (
        <button key={item.id} onClick={() => setSelectedItem({item, type, isOwned, isEquipped})} className={`relative group rounded-xl p-3 border-2 transition-all duration-200 flex flex-col items-center gap-2 aspect-square ${selectedItem?.item.id === item.id ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{background: rarityColor, boxShadow: `0 0 8px ${rarityColor}`}}></div>
            {isEquipped && <div className="absolute top-2 right-2 text-green-400 text-[10px] font-bold">EQUIPADO</div>}
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {type === 'model' && <svg viewBox="-10 -10 70 70" className="w-12 h-12 drop-shadow-md"><g transform="translate(25, 25) rotate(-90)"><path d={item.path} fill="white" stroke="#94a3b8" strokeWidth="2" /></g></svg>}
                {type === 'skin' && <svg viewBox="-10 -10 70 70" className="w-12 h-12 drop-shadow-md"><g transform="translate(25, 25) rotate(-90)"><path d={currentModelData.path} fill={item.color} stroke={item.secondaryColor} strokeWidth="2" /></g></svg>}
                {type === 'trail' && <TrailPreview style={item} />}
                {type === 'effect' && <div className="w-10 h-10"><EffectPreview style={item} /></div>}
                {type === 'boost' && <div className="text-2xl">{item.icon}</div>}
            </div>
            <div className="text-center w-full mt-auto">
                <p className="text-white font-bold text-[10px] truncate w-full">{item.name}</p>
                {!isOwned && <p className="text-yellow-400 text-[10px] font-mono">{item.price} 💰</p>}
            </div>
        </button>
      );
  };

  const renderMarketGrid = () => {
      let items: any[] = [];
      let ownedList: string[] = [];
      let currentId = '';
      if (marketCategory === 'model') { items = PLANE_MODELS; ownedList = ownedModels; currentId = currentModelId; }
      else if (marketCategory === 'skin') { items = PLANE_SKINS.filter(s => s.id !== 'legend_gold' || ownedSkins.includes('legend_gold')); ownedList = ownedSkins; currentId = currentSkinId; }
      else if (marketCategory === 'trail') { items = TRAILS.filter(t => t.id !== 'gold_glitter' || ownedTrails.includes('gold_glitter')); ownedList = ownedTrails; currentId = currentTrailId; }
      else if (marketCategory === 'effect') { items = DEATH_EFFECTS; ownedList = ownedDeathEffects; currentId = currentDeathEffectId; }
      else { items = BOOSTS; }
      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-4 md:pb-0 h-full content-start">
              {items.map(item => {
                  const isBoost = marketCategory === 'boost';
                  return renderItemCard(item, marketCategory, !isBoost && ownedList.includes(item.id), !isBoost && currentId === item.id);
              })}
          </div>
      );
  };

  // Fix for "Cannot find name 'renderWorkshopGrid'": Implementation of renderWorkshopGrid to display owned items.
  const renderWorkshopGrid = () => {
      let items: any[] = [];
      let currentId = '';
      if (workshopCategory === 'model') { items = PLANE_MODELS.filter(m => ownedModels.includes(m.id)); currentId = currentModelId; }
      else if (workshopCategory === 'skin') { items = PLANE_SKINS.filter(s => ownedSkins.includes(s.id)); currentId = currentSkinId; }
      else if (workshopCategory === 'trail') { items = TRAILS.filter(t => ownedTrails.includes(t.id)); currentId = currentTrailId; }
      else if (workshopCategory === 'effect') { items = DEATH_EFFECTS.filter(e => ownedDeathEffects.includes(e.id)); currentId = currentDeathEffectId; }
      
      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-4 md:pb-0 h-full content-start">
              {items.map(item => renderItemCard(item, workshopCategory, true, currentId === item.id))}
          </div>
      );
  };

  const DetailView = ({ mobile = false }) => {
      if (!selectedItem) return !mobile ? <div className="h-full flex flex-col items-center justify-center text-white/20"><div className="text-4xl mb-2">👆</div><p className="text-sm font-bold tracking-widest uppercase">Selecciona objeto</p></div> : null;
      return (
        <div className={`flex flex-col h-full animate-fade-in ${mobile ? 'p-8' : ''}`}>
            <div className="w-full aspect-square bg-black/40 rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner">
                <div className="absolute inset-0 opacity-20" style={{background: `radial-gradient(circle, ${getRarityColor(selectedItem.item.rarity || Rarity.COMMON)} 0%, transparent 70%)`}}></div>
                <div className="relative z-10 w-3/4 h-3/4 flex items-center justify-center">
                    {selectedItem.type === 'model' && <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl"><g transform="translate(25, 25) rotate(-90)"><path d={selectedItem.item.path} fill="white" stroke="gray" strokeWidth="1.5"/></g></svg>}
                    {selectedItem.type === 'skin' && <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl"><g transform="translate(25, 25) rotate(-90)"><path d={currentModelData.path} fill={selectedItem.item.color} stroke={selectedItem.item.secondaryColor} strokeWidth="1.5"/></g></svg>}
                    {selectedItem.type === 'trail' && <div className="w-full scale-125"><TrailPreview style={selectedItem.item} size="large" /></div>}
                    {selectedItem.type === 'effect' && <div className="w-40 h-40"><EffectPreview style={selectedItem.item} animate={true} /></div>}
                    {selectedItem.type === 'boost' && <span className="text-8xl">{selectedItem.item.icon}</span>}
                </div>
            </div>
            <h3 className="text-3xl font-black text-white leading-tight mb-1 italic uppercase tracking-tighter">{selectedItem.item.name}</h3>
            <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/5" style={{color: getRarityColor(selectedItem.item.rarity || Rarity.COMMON)}}>{selectedItem.item.rarity || 'COMÚN'}</span>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{selectedItem.type}</span>
            </div>
            <p className="text-white/60 text-sm mb-8 leading-relaxed italic">{selectedItem.item.description || 'Equipamiento avanzado para operaciones aéreas.'}</p>
            <div className="mt-auto w-full flex flex-col gap-3">
                {selectedItem.isOwned ? (
                    <button onClick={() => onEquip(selectedItem.type, selectedItem.item.id)} disabled={selectedItem.isEquipped} className={`w-full py-5 rounded-2xl font-black text-lg transition-all border-b-4 ${selectedItem.isEquipped ? 'bg-green-500/20 text-green-400 border-green-900/50' : 'bg-white text-black hover:bg-gray-100 border-gray-400 active:border-b-0 active:translate-y-1'}`}>
                        {selectedItem.isEquipped ? 'ACTIVO' : 'EQUIPAR'}
                    </button>
                ) : (
                    <button onClick={() => onBuy(selectedItem.type, selectedItem.item.id, selectedItem.item.price)} disabled={coins < selectedItem.item.price} className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-b-4 ${coins >= selectedItem.item.price ? 'bg-yellow-500 text-black border-yellow-700 hover:bg-yellow-400 active:border-b-0 active:translate-y-1 shadow-lg shadow-yellow-500/20' : 'bg-slate-700 text-slate-500 border-slate-800'}`}>
                        <span>COMPRAR</span> <span className="bg-black/10 px-3 py-1 rounded-lg text-xs font-mono">{selectedItem.item.price}💰</span>
                    </button>
                )}
                <button onClick={() => setSelectedItem(null)} className="w-full py-4 rounded-2xl font-bold bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all text-sm uppercase tracking-widest">Cerrar</button>
            </div>
        </div>
      );
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col-reverse md:flex-row bg-slate-950 text-white font-fredoka overflow-hidden h-screen w-screen animate-fade-in">
      <div className="w-full md:w-28 bg-black/60 border-t md:border-t-0 md:border-r border-white/5 flex flex-row md:flex-col items-center justify-evenly md:justify-start px-2 md:px-0 md:py-8 gap-1 md:gap-8 backdrop-blur-xl z-30 shrink-0 h-24 md:h-full">
          <button onClick={() => { setActiveSection('market'); setSelectedItem(null); }} className={`p-3 rounded-2xl transition-all flex flex-col items-center min-w-[70px] ${activeSection === 'market' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' : 'text-white/30 hover:bg-white/5'}`}>
              <div className="text-3xl mb-1">🛒</div><div className="text-[9px] font-black tracking-widest uppercase">Mercado</div>
          </button>
          <button onClick={() => { setActiveSection('workshop'); setSelectedItem(null); }} className={`p-3 rounded-2xl transition-all flex flex-col items-center min-w-[70px] ${activeSection === 'workshop' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-110' : 'text-white/30 hover:bg-white/5'}`}>
              <div className="text-3xl mb-1">🔧</div><div className="text-[9px] font-black tracking-widest uppercase">Hangar</div>
          </button>
          <button onClick={() => { setActiveSection('loot'); setSelectedItem(null); }} className={`p-3 rounded-2xl transition-all flex flex-col items-center min-w-[70px] ${activeSection === 'loot' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' : 'text-white/30 hover:bg-white/5'}`}>
              <div className="text-3xl mb-1">📦</div><div className="text-[9px] font-black tracking-widest uppercase">Carga</div>
          </button>
          <div className="md:mt-auto"><button onClick={onBack} className="p-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all flex flex-col items-center"><div className="text-3xl mb-1">🚪</div><span className="text-[9px] font-black uppercase tracking-widest">Salir</span></button></div>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-10 relative overflow-hidden h-full">
          <div className="flex justify-between items-center mb-8 shrink-0">
              <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter uppercase">
                  {activeSection === 'market' && 'Logística de Vuelo'}
                  {activeSection === 'workshop' && 'Personalización'}
                  {activeSection === 'loot' && 'Carga Aérea Táctica'}
              </h2>
              <div className="bg-white/5 border border-yellow-500/20 px-6 py-2 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md">
                  <span className="text-2xl animate-pulse">💰</span><span className="text-2xl font-black text-yellow-400 font-mono tracking-tighter">{coins}</span>
              </div>
          </div>

          <div className="flex-1 flex gap-10 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {(activeSection === 'market' || activeSection === 'workshop') && (
                      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                          {['model', 'skin', 'trail', 'effect', ...(activeSection === 'market' ? ['boost'] : [])].map(cat => (
                              <button key={cat} onClick={() => activeSection === 'market' ? setMarketCategory(cat as any) : setWorkshopCategory(cat as any)} className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase border tracking-widest transition-all ${(activeSection === 'market' ? marketCategory : workshopCategory) === cat ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}>
                                  {cat === 'model' ? 'Aviones' : cat === 'skin' ? 'Pintura' : cat === 'trail' ? 'Estela' : cat === 'effect' ? 'Impacto' : 'Mejoras'}
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="flex-1 overflow-hidden min-h-0 relative">
                      {activeSection === 'market' && renderMarketGrid()}
                      {activeSection === 'workshop' && renderWorkshopGrid()}
                      {activeSection === 'loot' && (
                          <div className="h-full flex items-center justify-center p-4 relative">
                              {/* ESCENA DE LOOT MEJORADA */}
                              <div className="w-full max-w-lg h-full flex flex-col items-center justify-center">
                                  {lootState === 'idle' && (
                                      <div className="text-center animate-fade-in">
                                          <div className="relative mb-12">
                                              <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-float">📦</div>
                                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl opacity-20">🪂</div>
                                          </div>
                                          <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Solicitar Carga Aérea</h3>
                                          <p className="text-white/40 text-sm mb-10 max-w-xs mx-auto italic">Recibe suministros aleatorios de alta gama. ¡Pura suerte de piloto!</p>
                                          <button onClick={handleStartLoot} disabled={coins < LOOT_BOX_PRICE} className={`group relative px-10 py-5 rounded-3xl font-black text-xl shadow-2xl transition-all border-b-8 ${coins >= LOOT_BOX_PRICE ? 'bg-yellow-500 text-black border-yellow-700 hover:bg-yellow-400 active:translate-y-1 active:border-b-4' : 'bg-slate-800 text-slate-500 border-slate-900 grayscale opacity-50'}`}>
                                              SOLICITAR - {LOOT_BOX_PRICE} 💰
                                              <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-bounce">URGENTE</div>
                                          </button>
                                      </div>
                                  )}

                                  {(lootState === 'dropping' || lootState === 'landing' || lootState === 'waiting_tap') && (
                                      <div className={`relative flex flex-col items-center w-full transition-all duration-700 ${lootState === 'dropping' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                                          <div className={`mb-4 transition-opacity duration-500 ${lootState === 'dropping' ? 'opacity-100' : 'opacity-0'}`}>
                                              <div className="w-40 h-24 border-t-8 border-white/20 rounded-full border-dashed"></div>
                                          </div>
                                          <button 
                                            onClick={handleBoxTap} 
                                            className={`text-9xl transition-all duration-300 relative cursor-pointer
                                                ${isShaking ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}
                                                ${lootState === 'waiting_tap' ? 'animate-float' : ''}
                                            `}
                                          >
                                              📦
                                              {lootState === 'waiting_tap' && (
                                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 animate-pulse pointer-events-none">
                                                      <p className="text-sm font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">¡TOCA RÁPIDO!</p>
                                                      <div className="flex gap-1 justify-center mt-2">
                                                          {[...Array(5)].map((_, i) => (
                                                              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${5 - tapsRemaining > i ? 'w-6 bg-cyan-400' : 'w-2 bg-white/20'}`}></div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}
                                          </button>
                                          <div className="w-60 h-8 bg-black/40 rounded-[100%] blur-xl mt-4"></div>
                                      </div>
                                  )}

                                  {lootState === 'opening' && (
                                      <div className="flex flex-col items-center animate-pulse">
                                          <div className="text-9xl animate-ping opacity-50">💥</div>
                                          <p className="text-xl font-black text-white mt-8 tracking-widest">DESEMPAQUETANDO...</p>
                                      </div>
                                  )}

                                  {(lootState === 'revealing' || lootState === 'revealed') && lootResult && (
                                      <div className={`flex flex-col items-center justify-center animate-zoom-in text-center`}>
                                          <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                                              {/* Rayos de fondo según rareza */}
                                              <div className="absolute inset-0 animate-spin-slow opacity-40 blur-3xl" style={{background: `radial-gradient(circle, ${getRarityColor(lootResult.item.rarity || Rarity.COMMON)} 0%, transparent 70%)`}}></div>
                                              
                                              <div className="relative z-10 w-full h-full flex items-center justify-center scale-125">
                                                {lootResult.type === 'model' && <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl animate-float"><g transform="translate(25, 25) rotate(-90)"><path d={(lootResult.item as PlaneModel).path} fill="white" stroke="gray" strokeWidth="1.5"/></g></svg>}
                                                {lootResult.type === 'skin' && <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl animate-float"><g transform="translate(25, 25) rotate(-90)"><path d={currentModelData.path} fill={(lootResult.item as PlaneSkin).color} stroke={(lootResult.item as PlaneSkin).secondaryColor} strokeWidth="1.5"/></g></svg>}
                                                {lootResult.type === 'trail' && <TrailPreview style={lootResult.item as TrailStyle} size="large" />}
                                                {lootResult.type === 'effect' && <div className="w-48 h-48"><EffectPreview style={lootResult.item as DeathEffectStyle} animate={true} /></div>}
                                              </div>
                                          </div>
                                          
                                          <div className="bg-black/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl translate-y-4">
                                              <h4 className="text-[10px] font-black tracking-[0.4em] uppercase mb-2" style={{color: getRarityColor(lootResult.item.rarity || Rarity.COMMON)}}>Objeto Desbloqueado</h4>
                                              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">{lootResult.item.name}</h3>
                                              <p className="text-white/40 text-xs mb-6 italic uppercase tracking-widest">{lootResult.type}</p>
                                              
                                              {lootResult.duplicate && (
                                                  <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl mb-6">
                                                      <p className="text-[10px] font-bold text-yellow-500">RECOMPENSA POR DUPLICADO: +{lootResult.refund} 💰</p>
                                                  </div>
                                              )}
                                              
                                              <button onClick={resetLoot} className="w-full py-4 bg-white text-black font-black text-lg rounded-2xl hover:bg-gray-200 transition-all border-b-4 border-gray-400 active:translate-y-1 active:border-b-0">CONTINUAR</button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
              <div className="hidden md:flex w-80 bg-black/40 rounded-3xl border border-white/5 p-8 flex-col shrink-0 h-full shadow-2xl">
                  <DetailView />
              </div>
          </div>
      </div>
      {selectedItem && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen animate-fade-in">
              <DetailView mobile={true} />
          </div>
      )}
      
      <style>{`
        @keyframes zoom-in {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
            animation: zoom-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-spin-slow {
            animation: spin 10s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
