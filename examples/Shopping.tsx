import React, { useState, useRef } from 'react';
import { AppLayout } from './AppLayout';
import {
  Plus, Check, MapPin, PlusCircle, MoreVertical,
  CalendarClock, ShoppingBasket, X, TrendingDown, TrendingUp
} from 'lucide-react';

interface ShoppingItem {
  id: string; name: string; market: string; category: string;
  qty: number; unit: string; price: number;
  purchased: boolean; postponed: boolean;
}

const INITIAL: ShoppingItem[] = [
  { id: '1', name: 'Arroz Prato Fino',     market: 'Cooper',  category: 'Dispensa',  qty: 2,   unit: 'pct', price: 28.90, purchased: true,  postponed: false },
  { id: '2', name: 'Feijão',               market: 'Cooper',  category: 'Dispensa',  qty: 1,   unit: 'kg',  price: 8.50,  purchased: false, postponed: false },
  { id: '3', name: 'Leite Integral',       market: 'Cooper',  category: 'Laticínios',qty: 12,  unit: 'un',  price: 4.89,  purchased: false, postponed: false },
  { id: '4', name: 'Peito de Frango',      market: 'Cooper',  category: 'Carnes',    qty: 2.5, unit: 'kg',  price: 19.90, purchased: false, postponed: false },
  { id: '5', name: 'Papel Higiênico Neve', market: 'Veneza',  category: 'Higiene',   qty: 1,   unit: 'pct', price: 32.90, purchased: false, postponed: false },
  { id: '6', name: 'Sabão em Pó Omo',      market: 'Veneza',  category: 'Limpeza',   qty: 1,   unit: 'cx',  price: 24.50, purchased: false, postponed: false },
];

const LIMITE_BASE = 2000;
const ROLLOVER = 200;
const LIMITE = LIMITE_BASE + ROLLOVER; // 2200

export function Shopping() {
  const [items, setItems] = useState<ShoppingItem[]>(INITIAL);
  const [isAdding, setIsAdding] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const togglePurchased = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
    setOpenMenu(null);
  };

  const postponeItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, postponed: true, purchased: false } : i));
    setOpenMenu(null);
  };

  const activeItems = items.filter(i => !i.postponed);
  const postponedItems = items.filter(i => i.postponed);

  const totalGasto = activeItems.filter(i => i.purchased).reduce((s, i) => s + i.qty * i.price, 0);
  const totalPrevisto = activeItems.reduce((s, i) => s + i.qty * i.price, 0);
  const disponivel = LIMITE - totalGasto;
  const progressPct = Math.min((totalGasto / LIMITE) * 100, 100);
  const isOverBudget = totalGasto > LIMITE;

  const markets = Array.from(new Set(activeItems.map(i => i.market)));

  return (
    <AppLayout activeTab="shopping">
      <div className="p-4 pb-[160px]">

        {/* ── Dynamic Budget Panel ── */}
        <div className="pt-2 mb-4">
          {/* Limit row */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg mb-0">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Limite do Mês</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  +R$ {ROLLOVER},00 rollover
                </span>
                <span className="font-bold text-sm text-slate-100">R$ {LIMITE.toLocaleString('pt-BR')},00</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : progressPct > 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Gasto / Disponível chips */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800/50 flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Gasto</span>
                <div className="flex items-center gap-1">
                  <TrendingDown size={12} className="text-rose-400" />
                  <span className="font-bold text-sm text-slate-200">R$ {totalGasto.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <div className={`rounded-xl p-2.5 border flex flex-col items-center ${isOverBudget ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <span className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>Disponível</span>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'} />
                  <span className={`font-bold text-sm ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {Math.abs(disponivel).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Add Form ── */}
        {isAdding ? (
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl mb-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-200">Novo Item</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nome do Produto" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none appearance-none">
                  <option>Cooper</option><option>Veneza</option><option>Atacadão</option>
                </select>
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none appearance-none">
                  <option>Dispensa</option><option>Laticínios</option><option>Carnes</option>
                  <option>Higiene</option><option>Limpeza</option><option>Hortifruti</option>
                  <option>Doces</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Qtd" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none text-center" />
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none appearance-none">
                  <option>UN</option><option>KG</option><option>PCT</option><option>CX</option>
                </select>
                <input type="text" placeholder="R$ Unit." className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
              </div>
              {/* Auto-calculated total */}
              <div className="flex justify-between items-center px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-xs font-semibold text-blue-400">Total calculado</span>
                <span className="font-bold text-blue-400">R$ 0,00</span>
              </div>
              <button className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20">
                Adicionar à Lista
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-blue-400 font-semibold mb-4 hover:bg-slate-900 transition-colors"
          >
            <PlusCircle size={19} /> Adicionar Item
          </button>
        )}

        {/* ── Items by Market ── */}
        <div className="space-y-5">
          {markets.map(market => (
            <div key={market}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <MapPin size={14} className="text-blue-500" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{market}</h2>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <div className="space-y-2">
                {activeItems.filter(i => i.market === market).map(item => (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-3 rounded-2xl border transition-all ${
                      item.purchased
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                        : 'bg-slate-900 border-slate-700 shadow-sm'
                    }`}
                    style={{ minHeight: '64px' }}
                  >
                    {/* Big checkbox */}
                    <button
                      onClick={() => togglePurchased(item.id)}
                      className="flex items-center justify-center w-14 h-full pl-3 shrink-0"
                      style={{ minHeight: '64px' }}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${
                        item.purchased
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'bg-slate-950 border-slate-600 text-transparent'
                      }`}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-3 pr-2">
                      <p className={`font-semibold truncate text-sm ${item.purchased ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.qty} {item.unit} × R$ {item.price.toFixed(2).replace('.', ',')} • {item.category}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0 pr-1">
                      <p className={`font-bold text-sm ${item.purchased ? 'text-slate-600' : 'text-slate-200'}`}>
                        R$ {(item.qty * item.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* 3-dot menu */}
                    <div className="relative shrink-0 pr-2">
                      <button
                        onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenu === item.id && (
                        <div className="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => togglePurchased(item.id)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left"
                          >
                            <ShoppingBasket size={16} className="text-emerald-400" />
                            <div>
                              <p className="text-sm font-semibold text-slate-200">Comprado</p>
                              <p className="text-[10px] text-slate-500">Risca o item e atualiza o estoque</p>
                            </div>
                          </button>
                          <div className="h-px bg-slate-800" />
                          <button
                            onClick={() => postponeItem(item.id)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left"
                          >
                            <CalendarClock size={16} className="text-amber-400" />
                            <div>
                              <p className="text-sm font-semibold text-slate-200">Adiar para próximo mês</p>
                              <p className="text-[10px] text-slate-500">Libera o orçamento atual</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Postponed items section */}
        {postponedItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <CalendarClock size={14} className="text-amber-400" />
              <h2 className="text-xs font-bold text-amber-400/70 uppercase tracking-widest">Adiados para o próximo mês</h2>
              <div className="h-px bg-amber-500/20 flex-1" />
            </div>
            <div className="space-y-2">
              {postponedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 opacity-60">
                  <CalendarClock size={14} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-slate-400 flex-1 truncate line-through">{item.name}</p>
                  <p className="text-xs text-amber-400/60 font-medium">próx. mês</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Total ── */}
      <div className="fixed bottom-[84px] left-0 right-0 z-40 max-w-[390px] mx-auto border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-5 py-3.5 flex justify-between items-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total da Nota</p>
          <p className="text-xs text-slate-500">Previsto: R$ {totalPrevisto.toFixed(2).replace('.', ',')}</p>
        </div>
        <p className="text-2xl font-bold tracking-tight">
          R$ <span className={isOverBudget ? 'text-rose-400' : 'text-blue-400'}>
            {totalGasto.toFixed(2).replace('.', ',')}
          </span>
        </p>
      </div>
    </AppLayout>
  );
}
