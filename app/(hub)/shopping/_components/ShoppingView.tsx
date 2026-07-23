'use client';

import { useState } from 'react';
import { PlusCircle, MapPin, CalendarClock, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BudgetPanel } from './BudgetPanel';
import { ShoppingItemCard } from './ShoppingItemCard';
import { AddShoppingItemSheet } from './AddShoppingItemSheet';
import { markBoughtAction, postponeItemAction } from '@/modules/shopping/shopping.actions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { ShoppingItem } from '@/types';

const DEFAULT_MARKETS = ['Cooper A1', 'Supermercado Veneza', 'Atacadão', 'Outros'];

interface ShoppingViewProps {
  initialItems: ShoppingItem[];
  selectedMonth: string;
  limiteBase: number;
  rollover: number;
  customMarkets?: string[];
}

export function ShoppingView({
  initialItems,
  selectedMonth,
  limiteBase,
  rollover,
  customMarkets = [],
}: ShoppingViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const allMarkets = Array.from(new Set([...DEFAULT_MARKETS, ...customMarkets]));

  const activeItems = items.filter((i) => i.status !== 'Adiado');
  const postponedItems = items.filter((i) => i.status === 'Adiado');

  const totalGasto = activeItems
    .filter((i) => i.status === 'Comprado')
    .reduce((s, i) => s + (i.total_price || i.qty * (i.estimated_unit_price || 0)), 0);

  const totalPrevisto = activeItems.reduce(
    (s, i) => s + (i.total_price || i.qty * (i.estimated_unit_price || 0)),
    0
  );

  const markets = Array.from(new Set(activeItems.map((i) => i.market_name || 'Cooper A1')));
  const isOverBudget = totalGasto > limiteBase + rollover;

  const handleToggleBought = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newStatus = i.status === 'Comprado' ? 'Pendente' : 'Comprado';
        return { ...i, status: newStatus };
      })
    );

    try {
      const res = await markBoughtAction({ itemId: id });
      if (res?.data?.success) {
        if (res.data.newStatus === 'Comprado') {
          toast.success('Item comprado! Adicionado às despesas.');
        }
      } else {
        toast.error('Erro ao atualizar item');
        // Revert optimistic update on failure
        setItems((prev) =>
          prev.map((i) => {
            if (i.id !== id) return i;
            const revert = i.status === 'Comprado' ? 'Pendente' : 'Comprado';
            return { ...i, status: revert };
          })
        );
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handlePostpone = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'Adiado' } : i))
    );

    try {
      const res = await postponeItemAction({ itemId: id, currentMonth: selectedMonth });
      if (res?.data?.success) {
        toast.success(`Item adiado para ${res.data.nextMonth}!`);
      } else {
        toast.error('Erro ao adiar item');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const goToNfce = (marketName?: string) => {
    const params = new URLSearchParams({ month: selectedMonth });
    if (marketName) {
      params.set('market', marketName);
      params.set('mode', 'market');
    }
    router.push(`/shopping/nfce?${params.toString()}`);
  };

  return (
    <div className="p-4 pb-[160px] relative">
      {/* Dynamic Budget Panel */}
      <BudgetPanel limiteBase={limiteBase} rollover={rollover} totalGasto={totalGasto} />

      {/* Action Buttons Row */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex-1 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-blue-400 font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all"
        >
          <PlusCircle size={19} /> Adicionar Item
        </button>
        <button
          onClick={() => goToNfce()}
          className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-purple-400 font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all"
          title="Escanear Nota Fiscal"
        >
          <QrCode size={19} />
        </button>
      </div>

      {/* Items grouped by Market */}
      {activeItems.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center text-xs text-slate-500">
          Sua lista de compras está vazia para este mês.
        </div>
      ) : (
        <div className="space-y-5">
          {markets.map((market) => {
            const marketItems = activeItems.filter(
              (i) => (i.market_name || 'Cooper A1') === market
            );
            if (marketItems.length === 0) return null;

            const marketTotal = marketItems
              .filter((i) => i.status === 'Comprado')
              .reduce((s, i) => s + (i.total_price || 0), 0);

            return (
              <div key={market}>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <MapPin size={14} className="text-blue-500" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {market}
                  </h2>
                  {marketTotal > 0 && (
                    <span className="text-xs text-emerald-500 font-semibold">
                      {formatCurrency(marketTotal)}
                    </span>
                  )}
                  <div className="h-px bg-slate-800 flex-1" />
                  {/* QR button per market */}
                  <button
                    onClick={() => goToNfce(market)}
                    className="flex items-center gap-1 text-[10px] text-purple-400/70 hover:text-purple-400 transition-colors px-2 py-1 rounded-lg hover:bg-purple-500/10"
                    title={`Escanear NF-e para ${market}`}
                  >
                    <QrCode size={12} />
                    NF-e
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {marketItems.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onToggleBought={handleToggleBought}
                      onPostpone={handlePostpone}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Postponed items section */}
      {postponedItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <CalendarClock size={14} className="text-amber-400" />
            <h2 className="text-xs font-bold text-amber-400/70 uppercase tracking-widest">
              Adiados para o próximo mês
            </h2>
            <div className="h-px bg-amber-500/20 flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {postponedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 opacity-60"
              >
                <CalendarClock size={14} className="text-amber-400 shrink-0" />
                <p className="text-sm text-slate-400 flex-1 truncate line-through">{item.name}</p>
                <p className="text-xs text-amber-400/60 font-medium">próx. mês</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Total Note */}
      <div className="fixed bottom-[74px] md:bottom-[84px] left-0 right-0 z-30 w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto border-t md:border border-slate-800 bg-slate-950/95 backdrop-blur-xl px-5 py-3.5 flex justify-between items-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] md:rounded-2xl">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            Total da Nota
          </p>
          <p className="text-xs text-slate-500">
            Previsto: {formatCurrency(totalPrevisto)}
          </p>
        </div>
        <p className="text-2xl font-bold tracking-tight">
          <span className={isOverBudget ? 'text-rose-400' : 'text-blue-400'}>
            {formatCurrency(totalGasto)}
          </span>
        </p>
      </div>

      {/* Add Item Sheet Modal */}
      <AddShoppingItemSheet
        selectedMonth={selectedMonth}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        availableMarkets={allMarkets}
      />
    </div>
  );
}
