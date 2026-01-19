
import React, { useState, useEffect } from 'react';
import { PLANE_MODELS, PLANE_SKINS, TRAILS, DEATH_EFFECTS, BOOSTS, LOOT_BOX_PRICE } from '../constants';
import { PlaneModel, PlaneSkin, TrailStyle, DeathEffectStyle, BoostItem, LootResult, Rarity } from '../types';
import { getRarityColor } from '../utils';

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

  // --- PREVIEW DATA ---
  const currentSkinData = PLANE_SKINS.find(s => s.id === currentSkinId) || PLANE_SKINS[0];
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
              setLootState('idle'); // Should not happen if coins check passed
          }
      }, 1500); // Animation delay
  };

  const resetLoot = () => {
      setLootState('idle');
      setLootResult(null);
  };

  const renderItemCard = (item: any, type: MarketCategory, isOwned: boolean, isEquipped: boolean) => {
      const isBoost = type === 'boost';
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
                    <div style={{background: item.color === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue)' : item.color}} className="w-8 h-2 rounded-full"></div>
                )}
                {type === 'effect' && <div style={{color: item.particleColor === 'random' ? 'white' : item.particleColor}} className="font-bold text-xl">💥</div>}
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
      else if (marketCategory === 'skin') { items = PLANE_SKINS; ownedList = ownedSkins; currentId = currentSkinId; }
      else if (marketCategory === 'trail') { items = TRAILS; ownedList = ownedTrails; currentId = currentTrailId; }
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
      
      // Filter only owned items
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
                {/* Rarity Glow Background */}
                <div className="absolute inset-0 opacity-20" style={{background: `radial-gradient(circle, ${getRarityColor(selectedItem.item.rarity || Rarity.COMMON)} 0%, transparent 70%)`}}></div>
                
                <div className="relative z-10 w-4/5 h-4/5 flex items-center justify-center">
                    {/* Re-render the visual */}
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
                    {selectedItem.type === 'trail' && <div style={{background: selectedItem.item.color === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue)' : selectedItem.item.color}} className="w-full h-8 rounded-full shadow-lg"></div>}
                    {selectedItem.type === 'effect' && <div style={{color: selectedItem.item.particleColor === 'random' ? 'white' : selectedItem.item.particleColor}} className="font-bold text-8xl drop-shadow-lg">💥</div>}
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

            {selectedItem.type === 'model' && (
                <div className="space-y-4 mb-6 w-full">
                    <div>
                        <div className="flex justify-between text-xs text-white/70 mb-1"><span>VELOCIDAD</span><span>{Math.round(selectedItem.item.stats.speed * 100)}%</span></div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden"><div className="h-full bg-cyan-400" style={{width: `${(selectedItem.item.stats.speed/1.5)*100}%`}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-white/70 mb-1"><span>MANIOBRA</span><span>{Math.round(selectedItem.item.stats.turn * 100)}%</span></div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden"><div className="h-full bg-purple-400" style={{width: `${(selectedItem.item.stats.turn/1.5)*100}%`}}></div></div>
                    </div>
                </div>
            )}

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
                    disabled={coins < selectedItem.item.price}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${coins >= selectedItem.item.price ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg' : 'bg-slate-700 text-slate-500'}`}
                    >
                        <span>COMPRAR</span> <span className="bg-black/10 px-2 py-0.5 rounded text-xs">{selectedItem.item.price}💰</span>
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
      
      {/* MOBILE NAV / DESKTOP SIDEBAR */}
      <div className="w-full md:w-24 bg-black/40 border-t md:border-t-0 md:border-r border-white/10 flex flex-row md:flex-col items-center justify-evenly md:justify-start px-2 md:px-0 md:py-6 gap-1 md:gap-6 backdrop-blur-md z-30 shrink-0 h-20 md:h-full">
          <div className="hidden md:block mb-4">
              <span className="text-3xl">✈️</span>
          </div>
          
          <button onClick={() => { setActiveSection('market'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'market' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl md:text-2xl">🛒</div>
              <div className="text-[10px] md:text-[9px] font-bold">MERCADO</div>
          </button>

          <button onClick={() => { setActiveSection('workshop'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'workshop' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl md:text-2xl">🔧</div>
              <div className="text-[10px] md:text-[9px] font-bold">TALLER</div>
          </button>

          <button onClick={() => { setActiveSection('loot'); setSelectedItem(null); }} className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center min-w-[60px] md:min-w-0 ${activeSection === 'loot' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' : 'text-white/40 hover:bg-white/5'}`}>
              <div className="text-2xl md:text-2xl">🎁</div>
              <div className="text-[10px] md:text-[9px] font-bold">CAJAS</div>
          </button>

          <div className="md:mt-auto md:ml-0">
              <button onClick={onBack} className="px-5 py-2 md:p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex flex-col items-center justify-center gap-1 border border-red-500/30 shadow-lg shadow-red-500/10 min-w-[70px] md:min-w-0">
                  <div className="text-2xl md:text-xl">🚪</div>
                  <span className="text-[10px] md:text-[9px] font-bold">SALIR</span>
              </button>
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
              <div>
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                      {activeSection === 'market' && 'MERCADO'}
                      {activeSection === 'workshop' && 'TALLER'}
                      {activeSection === 'loot' && 'SUMINISTROS'}
                  </h2>
                  <p className="text-white/40 text-[10px] md:text-xs tracking-widest font-bold">HANGAR</p>
              </div>
              <div className="bg-black/40 border border-yellow-500/30 px-4 py-1.5 md:px-6 md:py-2 rounded-full flex items-center gap-2 md:gap-3 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                  <span className="text-xl md:text-2xl">💰</span>
                  <span className="text-lg md:text-xl font-bold text-yellow-400 font-mono">{coins}</span>
              </div>
          </div>

          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* Left Panel: Content Grid */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Category Tabs for Market/Workshop */}
                  {(activeSection === 'market' || activeSection === 'workshop') && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
                          {['model', 'skin', 'trail', 'effect', ...(activeSection === 'market' ? ['boost'] : [])].map(cat => (
                              <button
                                key={cat}
                                onClick={() => activeSection === 'market' ? setMarketCategory(cat as any) : setWorkshopCategory(cat as any)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border whitespace-nowrap
                                    ${(activeSection === 'market' ? marketCategory : workshopCategory) === cat 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-black/30 text-white/50 border-white/10 hover:bg-white/5'}`}
                              >
                                  {cat === 'model' ? 'Aviones' : cat === 'skin' ? 'Pinturas' : cat === 'trail' ? 'Estelas' : cat === 'effect' ? 'Efectos' : 'Mejoras'}
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="bg-black/20 rounded-2xl border border-white/5 p-2 md:p-4 flex-1 overflow-hidden relative min-h-0">
                      {activeSection === 'market' && renderMarketGrid()}
                      
                      {activeSection === 'workshop' && renderWorkshopGrid()}

                      {activeSection === 'loot' && (
                          <div className="h-full flex flex-col items-center justify-center relative p-4">
                              {lootState === 'idle' && (
                                  <div className="text-center animate-float">
                                      <div className="text-8xl md:text-[100px] drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">🎁</div>
                                      <h3 className="text-xl md:text-2xl font-bold text-yellow-400 mt-4">CAJA MISTERIOSA</h3>
                                      <p className="text-white/60 text-xs md:text-sm mb-6">Contiene cosméticos de cualquier rareza.</p>
                                      
                                      <div className="flex justify-center gap-3 md:gap-4 mb-8">
                                          <div className="flex flex-col items-center"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-400 mb-1"></div><span className="text-[9px] md:text-[10px] text-slate-400">75%</span></div>
                                          <div className="flex flex-col items-center"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 mb-1"></div><span className="text-[9px] md:text-[10px] text-blue-500">18%</span></div>
                                          <div className="flex flex-col items-center"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500 mb-1"></div><span className="text-[9px] md:text-[10px] text-purple-500">5%</span></div>
                                          <div className="flex flex-col items-center"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500 mb-1"></div><span className="text-[9px] md:text-[10px] text-yellow-500">2%</span></div>
                                      </div>

                                      <button 
                                        onClick={handleLootClick}
                                        disabled={coins < LOOT_BOX_PRICE}
                                        className={`px-6 py-3 md:px-8 md:py-4 rounded-full font-black text-lg md:text-xl shadow-xl transition-all transform hover:scale-105 active:scale-95
                                            ${coins >= LOOT_BOX_PRICE 
                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-yellow-500/20' 
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                        `}
                                      >
                                          ABRIR - {LOOT_BOX_PRICE} 💰
                                      </button>
                                  </div>
                              )}

                              {lootState === 'opening' && (
                                  <div className="text-6xl animate-ping">📦</div>
                              )}

                              {lootState === 'revealed' && lootResult && (
                                  <div className="text-center animate-bounce-short">
                                      <p className="text-white/50 text-sm uppercase tracking-widest mb-2">HAS CONSEGUIDO</p>
                                      <div className="text-8xl mb-4 drop-shadow-2xl">{lootResult.type === 'effect' ? '💥' : lootResult.type === 'boost' ? (lootResult.item as BoostItem).icon : '✈️'}</div>
                                      <h3 className="text-3xl font-black text-white mb-1" style={{color: getRarityColor(lootResult.item.rarity || Rarity.COMMON)}}>{lootResult.item.name}</h3>
                                      <span className="px-3 py-1 rounded text-xs font-bold bg-white/10" style={{color: getRarityColor(lootResult.item.rarity || Rarity.COMMON)}}>
                                          {lootResult.item.rarity || 'COMÚN'}
                                      </span>

                                      {lootResult.duplicate && (
                                          <div className="mt-6 bg-black/40 border border-yellow-500/30 p-3 rounded-lg">
                                              <p className="text-yellow-400 font-bold text-sm">¡YA LO TENÍAS!</p>
                                              <p className="text-white/70 text-xs">Reembolso: +{lootResult.refund} 💰</p>
                                          </div>
                                      )}

                                      <button onClick={resetLoot} className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold">CONTINUAR</button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>

              {/* Desktop Detail Panel */}
              <div className="hidden md:flex w-72 bg-black/20 rounded-2xl border border-white/5 p-5 flex-col shrink-0 h-full">
                  <DetailView />
              </div>
          </div>
      </div>

      {/* Mobile Full Screen Detail Modal */}
      {selectedItem && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col animate-fade-in h-screen w-screen">
              <DetailView mobile={true} />
          </div>
      )}
    </div>
  );
};
