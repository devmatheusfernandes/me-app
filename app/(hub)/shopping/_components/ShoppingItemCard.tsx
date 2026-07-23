'use client';

import { useState } from 'react';
import { Check, MoreVertical, ShoppingBasket, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ShoppingItem } from '@/types';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggleBought: (id: string) => void;
  onPostpone: (id: string) => void;
}

export function ShoppingItemCard({
  item,
  onToggleBought,
  onPostpone,
}: ShoppingItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isBought = item.status === 'Comprado';
  const price = Number(item.estimated_unit_price || 0);
  const totalPrice = Number(item.total_price || item.qty * price);

  return (
    <div
      className={`relative flex items-center gap-3 rounded-2xl border transition-all ${
        isBought
          ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
          : 'bg-slate-900 border-slate-700 shadow-sm'
      }`}
      style={{ minHeight: '64px' }}
    >
      {/* Big checkbox button */}
      <button
        onClick={() => onToggleBought(item.id!)}
        className="flex items-center justify-center w-14 h-full pl-3 shrink-0"
        style={{ minHeight: '64px' }}
        aria-label="Marcar comprado"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${
            isBought
              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
              : 'bg-slate-950 border-slate-600 text-transparent'
          }`}
        >
          <Check size={16} strokeWidth={3} />
        </div>
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0 py-3 pr-2" onClick={() => onToggleBought(item.id!)}>
        <p
          className={`font-semibold truncate text-sm ${
            isBought ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {item.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {item.qty} {item.unit} × {formatCurrency(price)} • {item.category}
        </p>
      </div>

      {/* Item Total Price */}
      <div className="text-right shrink-0 pr-1">
        <p className={`font-bold text-sm ${isBought ? 'text-slate-600' : 'text-slate-200'}`}>
          {formatCurrency(totalPrice)}
        </p>
      </div>

      {/* 3-dot menu */}
      <div className="relative shrink-0 pr-2 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setMenuOpen(false);
                onToggleBought(item.id!);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left"
            >
              <ShoppingBasket size={16} className="text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {isBought ? 'Desmarcar' : 'Comprado'}
                </p>
                <p className="text-[10px] text-slate-500">Risca o item e atualiza o estoque</p>
              </div>
            </button>
            <div className="h-px bg-slate-800" />
            <button
              onClick={() => {
                setMenuOpen(false);
                onPostpone(item.id!);
              }}
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
  );
}
