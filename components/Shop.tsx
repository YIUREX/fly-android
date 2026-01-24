
import React, { useState, useEffect } from 'react';
import { PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS, BOOSTS, LOOT_BOX_PRICE } from '../constants';
import { PlaneModel, PlaneSkin, TrailStyle, DeathEffectStyle, BoostItem, LootResult, Rarity } from '../types';
import { getRarityColor } from '../utils';

// --- SUB-COMPONENTE PARA PREVISUALIZAR ESTELAS ---
const TrailPreview: React.FC<{ style: TrailStyle, size?: 'small' | 'large' }> = ({ style, size = 'small' }) => {
    const isLarge = size === 'large';
    const color = style.color === 'rainbow' ? 'url(#rainbow-grad)' : style.color;
    const width = isLarge ? 8 : 4;
    const glow = style.glow ? (style.color === 'rainbow' ? '#ff00ff' : style.color) : 'transparent';

    const renderContent = () => {
        // Un camino curvo que simula movimiento
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
                // Fixed: Removed unreachable 'style.type === "bubbles"' check to resolve TS overlap error since bubbles is handled above
                return <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray="none" />;
        }
    };

    return (
        <svg viewBox="0 0 100 50" className={`w-full ${isLarge ? 'h-24' : 'h-8'}`}>
            <defs>
                <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="red" />
                    <stop offset="25%" stopColor="yellow" />
                    <stop offset="50%" stopColor="green" />
                    <stop offset="75%" stopColor="blue" />
                    <stop offset="100%" stopColor="purple" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g filter={style.glow ? "url(#glow)" : ""} stroke={style.glow ? glow : "none"}>
                {renderContent()}
            </g>
        </svg>
    );
};

// --- SUB-COMPONENTE PARA PREVISUALIZAR EXPLOSIONES ---
const EffectPreview: React.FC<{ style: DeathEffectStyle, animate?: boolean }> = ({ style, animate = false }) => {
    const color = style.particleColor === 'random' ? '#ff00ff' : style.particleColor;
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className={`absolute w-4 h-4 rounded-full ${animate ? 'animate-ping' : ''}`} style={{ backgroundColor: color }}></div>
            {[...Array(12)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ 
                        backgroundColor: color,
                        opacity: 0.6,
                        transform: `rotate(${i * 30}deg) translateY(${animate ? '-40px' : '-15px'}) scale(${animate ? 0 : 1})`,
                        transition: animate ? 'all 0.8s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                    }}
                ></div>
            ))}
            {animate && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '0.4s' }}></div>
                </div>
            )}
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

export const Shop: React.FC<ShopProps> = ({ 
  coins, ownedModels, ownedSkins, ownedTrails, ownedDeathEffects, boostInventory,
  currentModelId, currentSkinId, currentTrailId, currentDeathEffectId, 
  onBuy, onEquip, onBack, onOpenLootBox 
}) => {
  const [activeSection, setActiveSection] = useState<ShopSection>('market');
  const [marketCategory, setMarketCategory] = useState<MarketCategory>('model');
  const [workshopCategory, setWorkshopCategory] = useState<Exclude<MarketCategory, 'boost'>>('model');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lootState, setLootState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [lootResult, setLootResult] = useState<LootResult | null>(null);

  const currentModelData = PLANE_MODELS.find(m => m.id === currentModelId) || PLANE_MODELS[0];

  const handleLootClick = () => {
      if (coins < LOOT_BOX_PRICE) return;
      setLootState('opening');
      setTimeout(() => {
          const result = onOpenLootBox();
          if (result) {
              setLootResult(result);
              setLootState('revealed');
          } else {
              setLootState('idle');
          }
      }, 1500);
  };

  const resetLoot = () => {
      setLootState('idle');
      setLootResult(null);
  };

  const renderItemCard = (item: any, type: MarketCategory, isOwned: boolean, isEquipped: boolean) => {
      const rarityColor = getRarityColor(item.rarity || Rarity.COMMON);
      
      return (
        <button
            key={item.id}
            onClick={() => setSelectedItem({item, type, isOwned, isEquipped})}
            className={`relative group rounded-xl p-3 border-2 transition-all duration-200 flex flex-col items-center gap-2 aspect-square
                ${selectedItem?.item.id === item.id 
                    ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}
            `}
        >
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full shadow-[0_0_5px]" style={{background: rarityColor, boxShadow: `0 0 8px ${rarityColor}`}}></div>
            {isEquipped && <div className="absolute top-2 right-2 text-green-400 text-[10px] font-bold">EQUIPADO</div>}
            
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {type === 'model' && (
                    <svg viewBox="-10 -10 70 70" className="w-12 h-12 drop-shadow-md">
                        <g transform="translate(25, 25) rotate(-90)">
                            <path d={item.path} fill="white" stroke="#94a3b8" strokeWidth="2" />
                        </g>
                    </svg>
                )}
                {type === 'skin' && (
                    <svg viewBox="-10 -10 70 70" className="w-12 h-12 drop-shadow-md">
                        <g transform="translate(25, 25) rotate(-90)">
                            <path d={currentModelData.path} fill={item.color} stroke={item.secondaryColor} strokeWidth="2" />
                        </g>
                    </svg>
                )}
                {type === 'trail' && (
                    <TrailPreview style={item} />
                )}
                {type === 'effect' && (
                    <div className="w-10 h-10">
                        <EffectPreview style={item} />
                    </div>
                )}
                {type === 'boost' && <div className="text-2xl">{item.icon}</div>}
            </div>
            
            <div className="text-center w-full mt-auto">
                <p className="text-white font-bold text-[10px] truncate w-full">{item.name}</p>
                {type !== 'boost' && !isOwned && (
                    <p className="text-yellow-400 text-[10px] font-mono">{item.price} 💰</p>
                )}
                {type === 'boost' && (
                    <p className="text-yellow-400 text-[10px] font-mono">{item.price} 💰</p>
                )}
            </div>
        </button>
      );
  };

  const renderMarketGrid = () => {
      let items: any[] = [];
      let ownedList: string[] = [];
      let currentId = '';

      if (marketCategory === 'model') { items = PLANE_MODELS; ownedList = ownedModels; currentId = currentModelId; }
      else if (marketCategory === 'skin') { 
          items = PLANE_SKINS.filter(s => s.id !== 'legend_gold' || ownedSkins.includes('legend_gold')); 
          ownedList = ownedSkins; 
          currentId = currentSkinId; 
      }
      else if (marketCategory === 'trail') { 
          items = TRAILS.filter(t => t.id !== 'gold_glitter' || ownedTrails.includes('gold_glitter')); 
          ownedList = ownedTrails; 
          currentId = currentTrailId; 
      }
      else if (marketCategory === 'effect') { items = DEATH_EFFECTS; ownedList = ownedDeathEffects; currentId = currentDeathEffectId; }
      else { items = BOOSTS; }

      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-4 md:pb-0 h-full content-start">
              {items.map(item => {
                  const isBoost = marketCategory === 'boost';
                  const isOwned = !isBoost && ownedList.includes(item.id);
                  const isEquipped = !isBoost && currentId === item.id;
                  return renderItemCard(item, marketCategory, isOwned, isEquipped);
              })}
          </div>
      );
  };

  const renderWorkshopGrid = () => {
      let items: any[] = [];
      let currentId = '';
      
      if (workshopCategory === 'model') { items = PLANE_MODELS.filter(i => ownedModels.includes(i.id)); currentId = currentModelId; }
      else if (workshopCategory === 'skin') { items = PLANE_SKINS.filter(i => ownedSkins.includes(i.id)); currentId = currentSkinId; }
      else if (workshopCategory === 'trail') { items = TRAILS.filter(i => ownedTrails.includes(i.id)); currentId = currentTrailId; }
      else if (workshopCategory === 'effect') { items = DEATH_EFFECTS.filter(i => ownedDeathEffects.includes(i.id)); currentId = currentDeathEffectId; }

      if (items.length === 0) return <div className="text-white/50 text-center py-10 italic text-sm">Vacío. ¡Compra algo en el Mercado!</div>;

      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-4 md:pb-0 h-full content-start">
              {items.map(item => renderItemCard(item, workshopCategory, true, item.id === currentId))}
          </div>
      );
  };

  const DetailView = ({ mobile = false }) => {
      if (!selectedItem) {
          if (mobile) return null;
          return (
            <div className="h-full flex flex-col items-center justify-center text-white/20">
                <div className="text-4xl mb-2">👆</div>
                <p className="text-sm font-bold">SELECCIONA UN OBJETO</p>
            </div>
          );
      }

      return (
        <div className={`flex flex-col h-full ${mobile ? 'p-6' : ''}`}>
            <div className="w-full aspect-square bg-black/40 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner">
                <div className="absolute inset-0 opacity-20" style={{background: `radial-gradient(circle, ${getRarityColor(selectedItem.item.rarity || Rarity.COMMON)} 0%, transparent 70%)`}}></div>
                <div className="relative z-10 w-4/5 h-4/5 flex items-center justify-center">
                    {selectedItem.type === 'model' && (
                        <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl">
                            <g transform="translate(25, 25) rotate(-90)">
                                <path d={selectedItem.item.path} fill="white" stroke="gray" strokeWidth="1.5"/>
                            </g>
                        </svg>
                    )}
                    {selectedItem.type === 'skin' && (
                        <svg viewBox="-15 -15 80 80" className="w-full h-full drop-shadow-2xl">
                            <g transform="translate(25, 25) rotate(-90)">
                                <path d={currentModelData.path} fill={selectedItem.item.color} stroke={selectedItem.item.secondaryColor} strokeWidth="1.5"/>
                            </g>
                        </svg>
                    )}
                    {selectedItem.type === 'trail' && (
                        <div className="w-full scale-150">
                            <TrailPreview style={selectedItem.item} size="large" />
                        </div>
                    )}
                    {selectedItem.type === 'effect' && (
                        <div className="w-32 h-32">
                            <EffectPreview style={selectedItem.item} animate={true} />
                        </div>
                    )}
                    {selectedItem.type === 'boost' && <span className="text-8xl drop-shadow-lg">{selectedItem.item.icon}</span>}
                </div>
            </div>

            <h3 className="text-2xl font-black text-white leading-none mb-2">{selectedItem.item.name}</h3>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10" style={{color: getRarityColor(selectedItem.item.rarity || Rarity.COMMON)}}>
                    {selectedItem.item.rarity || 'COMÚN'}
                </span>
                <span className="text-[10px] text-white/40 uppercase">{selectedItem.type === 'model' ? 'AVIÓN' : selectedItem.type}</span>
            </div>

            <p className="text-white/60 text-sm mb-6 leading-relaxed">
                {selectedItem.item.description || 'Mejora visual para tu avión.'}
            </p>

            <div className="mt-auto w-full flex flex-col gap-3">
                {selectedItem.type === 'boost' ? (
                    <div className="text-center w-full">
                        <p className="text-xs text-white/50 mb-2">TIENES: {boostInventory[selectedItem.item.id] || 0}</p>
                        <button 
                        onClick={() => onBuy('boost', selectedItem.item.id, selectedItem.item.price)}
                        disabled={coins < selectedItem.item.price}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${coins >= selectedItem.item.price ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg' : 'bg-slate-700 text-slate-500'}`}
                        >
                            <span>COMPRAR</span> <span className="bg-black/10 px-2 py-0.5 rounded text-xs">{selectedItem.item.price}💰</span>
                        </button>
                    </div>
                ) : selectedItem.isOwned ? (
                    <button 
                    onClick={() => onEquip(selectedItem.type, selectedItem.item.id)}
                    disabled={selectedItem.isEquipped}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${selectedItem.isEquipped ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white text-black hover:bg-gray-200 shadow-lg'}`}
                    >
                        {selectedItem.isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                    </button>
                ) : (
                    <button 
                    onClick={() => onBuy(selectedItem.type, selectedItem.item.id, selectedItem.item.price)}
                    disabled={coins < selectedItem.item.price || selectedItem.item.price === 0}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${coins >= selectedItem.item.price && selectedItem.item.price > 0 ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg' : 'bg-slate-700 text-slate-500'}`}
                    >
                        <span>{selectedItem.item.price === 0 ? 'BLOQUEADO' : 'COMPRAR'}</span> {selectedItem.item.price > 0 && <span className="bg-black/10 px-2 py-0.5 rounded text-xs">{selectedItem.item.price}💰</span>}
                    </button>
                )}

                <button 
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-3 rounded-xl font-bold bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                >
                    VOLVER
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col-reverse md:flex-row bg-slate-900 text-white font-fredoka overflow-hidden h-screen w-screen">
      <div className="w-full md:w-24 bg-black/40 border-t md:border-t-0 md:border-r border-white/10 flex flex-row md:flex-col items-center justify-evenly md:justify-start px-2 md:px-0 md:py-6 gap-1 md:gap-6 backdrop-blur-md z-30 shrink-0 h-20 md:h-full">
          <button onClick={() => { setActiveSection('market'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'market' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl">🛒</div>
              <div className="text-[10px] font-bold">MERCADO</div>
          </button>
          <button onClick={() => { setActiveSection('workshop'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'workshop' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl">🔧</div>
              <div className="text-[10px] font-bold">TALLER</div>
          </button>
          <button onClick={() => { setActiveSection('loot'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'loot' ? 'bg-yellow-500 text-white shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl">🎁</div>
              <div className="text-[10px] font-bold">CAJAS</div>
          </button>
          <div className="md:mt-auto">
              <button onClick={onBack} className="px-5 py-2 md:p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex flex-col items-center border border-red-500/30">
                  <div className="text-2xl">🚪</div>
                  <span className="text-[10px] font-bold">SALIR</span>
              </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden h-full">
          <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
              <div>
                  <h2 className="text-2xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                      {activeSection === 'market' && 'MERCADO'}
                      {activeSection === 'workshop' && 'TALLER'}
                      {activeSection === 'loot' && 'SUMINISTROS'}
                  </h2>
              </div>
              <div className="bg-black/40 border border-yellow-500/30 px-4 py-1.5 rounded-full flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className="text-lg font-bold text-yellow-400 font-mono">{coins}</span>
              </div>
          </div>

          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {(activeSection === 'market' || activeSection === 'workshop') && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
                          {['model', 'skin', 'trail', 'effect', ...(activeSection === 'market' ? ['boost'] : [])].map(cat => (
                              <button
                                key={cat}
                                onClick={() => activeSection === 'market' ? setMarketCategory(cat as any) : setWorkshopCategory(cat as any)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase border whitespace-nowrap
                                    ${(activeSection === 'market' ? marketCategory : workshopCategory) === cat 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-black/30 text-white/50 border-white/10'}`}
                              >
                                  {cat === 'model' ? 'Aviones' : cat === 'skin' ? 'Pinturas' : cat === 'trail' ? 'Estelas' : cat === 'effect' ? 'Efectos' : 'Mejoras'}
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="bg-black/20 rounded-2xl border border-white/5 p-2 md:p-4 flex-1 overflow-hidden min-h-0">
                      {activeSection === 'market' && renderMarketGrid()}
                      {activeSection === 'workshop' && renderWorkshopGrid()}
                      {activeSection === 'loot' && (
                          <div className="h-full flex flex-col items-center justify-center relative p-4">
                              {lootState === 'idle' && (
                                  <div className="text-center">
                                      <div className="text-8xl md:text-[100px] animate-float">🎁</div>
                                      <h3 className="text-xl md:text-2xl font-bold text-yellow-400 mt-4">CAJA MISTERIOSA</h3>
                                      <button 
                                        onClick={handleLootClick}
                                        disabled={coins < LOOT_BOX_PRICE}
                                        className={`px-6 py-3 mt-8 rounded-full font-black text-lg shadow-xl transition-all
                                            ${coins >= LOOT_BOX_PRICE ? 'bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500'}
                                        `}
                                      >
                                          ABRIR - {LOOT_BOX_PRICE} 💰
                                      </button>
                                  </div>
                              )}
                              {lootState === 'opening' && <div className="text-6xl animate-ping">📦</div>}
                              {lootState === 'revealed' && lootResult && (
                                  <div className="text-center animate-bounce-short">
                                      <div className="text-8xl mb-4">{lootResult.type === 'effect' ? '💥' : '✈️'}</div>
                                      <h3 className="text-3xl font-black text-white mb-1" style={{color: getRarityColor(lootResult.item.rarity || Rarity.COMMON)}}>{lootResult.item.name}</h3>
                                      <button onClick={resetLoot} className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold">CONTINUAR</button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
              <div className="hidden md:flex w-72 bg-black/20 rounded-2xl border border-white/5 p-5 flex-col shrink-0 h-full">
                  <DetailView />
              </div>
          </div>
      </div>
      {selectedItem && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col h-screen w-screen">
              <DetailView mobile={true} />
          </div>
      )}
    </div>
  );
};
