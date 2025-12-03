import React, { useState } from 'react';
import { SKINS, TRAILS, DEATH_EFFECTS, BOOSTS } from '../constants';
import { BoostType } from '../types';

interface ShopProps {
  coins: number;
  ownedSkins: string[];
  ownedTrails: string[];
  ownedDeathEffects: string[];
  boostInventory: Record<string, number>;
  currentSkinId: string;
  currentTrailId: string;
  currentDeathEffectId: string;
  onBuy: (type: 'skin' | 'trail' | 'effect' | 'boost', id: string, cost: number) => void;
  onEquip: (type: 'skin' | 'trail' | 'effect', id: string) => void;
  onBack: () => void;
}

export const Shop: React.FC<ShopProps> = ({ 
  coins, ownedSkins, ownedTrails, ownedDeathEffects, boostInventory,
  currentSkinId, currentTrailId, currentDeathEffectId, 
  onBuy, onEquip, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'trail' | 'effect' | 'boost'>('skin');

  const renderItems = () => {
    let items: any[] = [];
    let ownedList: string[] = [];
    let currentId = '';

    if (activeTab === 'skin') {
      items = SKINS;
      ownedList = ownedSkins;
      currentId = currentSkinId;
    } else if (activeTab === 'trail') {
      items = TRAILS;
      ownedList = ownedTrails;
      currentId = currentTrailId;
    } else if (activeTab === 'effect') {
      items = DEATH_EFFECTS;
      ownedList = ownedDeathEffects;
      currentId = currentDeathEffectId;
    } else {
      items = BOOSTS;
    }

    return items.map((item) => {
      const isBoost = activeTab === 'boost';
      const isOwned = !isBoost && ownedList.includes(item.id);
      const isEquipped = !isBoost && currentId === item.id;
      const count = isBoost ? (boostInventory[item.id] || 0) : 0;

      return (
        <div 
          key={item.id}
          className={`
            relative p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-200
            ${isEquipped 
              ? 'bg-green-500/20 border-2 border-green-400 scale-105 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
              : 'bg-white/20 border-white/40 hover:bg-white/30'}
            ${!isOwned && !isBoost ? 'opacity-90' : ''}
          `}
        >
          {/* Visual Placeholder */}
          <div className="w-16 h-16 relative flex items-center justify-center bg-black/10 rounded-lg overflow-hidden">
             {activeTab === 'skin' && (
                <svg viewBox="0 0 30 40" className="w-10 h-10 drop-shadow-md">
                   <path d="M15 0 L30 40 L15 35 L0 40 Z" fill={item.color} stroke={item.secondaryColor} strokeWidth="2" />
                </svg>
             )}
             {activeTab === 'trail' && (
                <div style={{background: item.color === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue)' : item.color}} className="w-10 h-2 rounded-full"></div>
             )}
             {activeTab === 'effect' && (
                <div style={{color: item.particleColor === 'random' ? 'white' : item.particleColor}} className="font-bold text-2xl">💥</div>
             )}
             {activeTab === 'boost' && (
                <div className="font-bold text-3xl">{item.icon}</div>
             )}
          </div>

          <div className="text-center">
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">{item.name}</h3>
            {activeTab === 'skin' && <p className="text-white/60 text-xs mt-1 capitalize">{item.type}</p>}
            {isBoost && <p className="text-white/60 text-xs mt-1">{item.description}</p>}
          </div>

          <div className="mt-auto w-full">
            {isBoost ? (
                 <div className="w-full">
                    <div className="mb-2 text-center text-xs font-bold text-yellow-300">TIENES: {count}</div>
                    <button
                        onClick={() => onBuy('boost', item.id, item.price)}
                        disabled={coins < item.price}
                        className={`
                        w-full py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1
                        ${coins >= item.price 
                            ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                        `}
                    >
                        <span>+{item.price}</span> 💰
                    </button>
                 </div>
            ) : isOwned ? (
              <button
                onClick={() => onEquip(activeTab as any, item.id)}
                disabled={isEquipped}
                className={`
                  w-full py-2 rounded-lg font-bold text-sm transition-colors
                  ${isEquipped 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-white/10 text-white hover:bg-white/20'}
                `}
              >
                {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
              </button>
            ) : (
              <button
                onClick={() => onBuy(activeTab as any, item.id, item.price)}
                disabled={coins < item.price}
                className={`
                  w-full py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1
                  ${coins >= item.price 
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                `}
              >
                <span>{item.price}</span> 💰
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center p-4 overflow-y-auto backdrop-blur-md bg-slate-900/95 touch-action-pan-y">
      <div className="w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-white/10 bg-white/5 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Hangar</h2>
          <div className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
            <span>💰</span> {coins}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-xl overflow-x-auto touch-action-pan-x">
            <button onClick={() => setActiveTab('skin')} className={`flex-1 py-2 px-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'skin' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}>AVIONES</button>
            <button onClick={() => setActiveTab('trail')} className={`flex-1 py-2 px-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'trail' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}>ESTELAS</button>
            <button onClick={() => setActiveTab('effect')} className={`flex-1 py-2 px-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'effect' ? 'bg-red-500 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}>EFECTOS</button>
            <button onClick={() => setActiveTab('boost')} className={`flex-1 py-2 px-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'boost' ? 'bg-yellow-500 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}>MEJORAS</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderItems()}
        </div>

        <button 
          onClick={onBack}
          className="mt-8 w-full py-4 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold text-xl shadow-lg transition-all border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
        >
          VOLVER AL MENÚ
        </button>
      </div>
    </div>
  );
};