'use client';

import { Plus, Minus, Tag, Info } from 'lucide-react';
import type { InventoryItem } from '@/types';

interface InventoryItemCardProps {
  item: InventoryItem;
  onUpdateQty: (id: string, delta: number) => void;
  onOpenPromo: (item: InventoryItem) => void;
  onOpenDetail: (item: InventoryItem) => void;
}

export function InventoryItemCard({
  item,
  onUpdateQty,
  onOpenPromo,
  onOpenDetail,
}: InventoryItemCardProps) {
  const isLow = item.current_qty <= item.min_qty;

  return (
    <div
      className={`bg-slate-900 rounded-2xl border transition-all ${
        isLow ? 'border-rose-500/20' : 'border-slate-800'
      }`}
    >
      {/* Main row */}
      <div className="flex justify-between items-center p-4">
        {/* Clickable info area to open details sheet */}
        <div
          onClick={() => onOpenDetail(item)}
          className="flex-1 min-w-0 mr-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-slate-200 group-hover:text-blue-400 transition-colors truncate">
              {item.name}
            </p>
            <Info size={13} className="text-slate-600 group-hover:text-blue-400 shrink-0 transition-colors" />
            {isLow && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
                Baixo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Mín: {item.min_qty} {item.unit}
          </p>
        </div>

        {/* Large stepper */}
        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 shadow-inner shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.id!, -1);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="Diminuir"
          >
            <Minus size={18} />
          </button>

          <span
            className={`w-8 text-center font-bold text-lg ${
              isLow ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {item.current_qty}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.id!, 1);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="Aumentar"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Promo button */}
      <button
        onClick={() => onOpenPromo(item)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-slate-800/60 text-xs font-semibold text-amber-400 hover:bg-amber-500/5 transition-colors rounded-b-2xl"
      >
        <Tag size={13} className="text-amber-400" />
        Registrar Compra por Promoção
      </button>
    </div>
  );
}
