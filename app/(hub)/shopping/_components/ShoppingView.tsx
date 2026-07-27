'use client';

import { useState } from 'react';
import { PlusCircle, MapPin, QrCode, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BudgetPanel } from './BudgetPanel';
import { ShoppingItemCard } from './ShoppingItemCard';
import { AddShoppingItemSheet } from './AddShoppingItemSheet';
import { EditShoppingItemSheet } from './EditShoppingItemSheet';
import { markBoughtAction, postponeItemAction } from '@/modules/shopping/shopping.actions';
import { formatCurrency, downloadCsv } from '@/lib/utils';
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
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Collapsible category state: key = "market::category"
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

  const allMarkets = Array.from(new Set([...DEFAULT_MARKETS, ...customMarkets]));

  const activeItems = items.filter((i) => i.status !== 'Adiado');

  const totalGasto = activeItems
    .filter((i) => i.status === 'Comprado')
    .reduce((s, i) => s + (i.total_price || i.qty * (i.estimated_unit_price || 0)), 0);

  const totalPrevisto = activeItems.reduce(
    (s, i) => s + (i.total_price || i.qty * (i.estimated_unit_price || 0)),
    0
  );

  const markets = Array.from(new Set(activeItems.map((i) => i.market_name || 'Cooper A1')));
  const isOverBudget = totalGasto > limiteBase + rollover;

  const toggleCategoryCollapse = (key: string) => {
    setCollapsedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    // Remove optimistically from current month view
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await postponeItemAction({ itemId: id, currentMonth: selectedMonth });
      if (res?.data?.success) {
        toast.success(`Item movido para ${res.data.nextMonth}!`);
      } else {
        toast.error('Erro ao adiar item');
        // Cannot easily revert without refetching; just show error
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleItemAdded = (item: ShoppingItem) => {
    setItems((prev) => [...prev, item]);
  };

  const handleItemUpdated = (updatedItem: ShoppingItem) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
  };

  const goToNfce = (marketName?: string) => {
    const params = new URLSearchParams({ month: selectedMonth });
    if (marketName) {
      params.set('market', marketName);
      params.set('mode', 'market');
    }
    router.push(`/shopping/nfce?${params.toString()}`);
  };

  const handleExportExcel = () => {
    if (activeItems.length === 0) {
      toast.error('Nenhum item para exportar.');
      return;
    }

    const headers = [
      'Nome do Produto',
      'Mercado',
      'Categoria',
      'Quantidade',
      'Unidade',
      'Preço Estimado Unitário (R$)',
      'Preço Total (R$)',
      'Status'
    ];

    const rows = activeItems.map(item => [
      item.name,
      item.market_name || 'Cooper A1',
      item.category || 'Outros',
      item.qty,
      item.unit,
      item.estimated_unit_price || 0,
      item.total_price || (item.qty * (item.estimated_unit_price || 0)),
      item.status
    ]);

    downloadCsv(headers, rows, `compras-${selectedMonth}`);
    toast.success('Lista de compras exportada com sucesso!');
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
        <button
          onClick={handleExportExcel}
          className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-emerald-400 font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all"
          title="Exportar para Excel"
        >
          <Download size={19} />
        </button>
      </div>

      {/* Items grouped by Market, then by Category (collapsible) */}
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

            // Group items by category within this market
            const categories = Array.from(new Set(marketItems.map((i) => i.category || 'Outros')));

            return (
              <div key={market}>
                {/* Market header */}
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

                {/* Categories within market (collapsible) */}
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const collapseKey = `${market}::${cat}`;
                    const isCollapsed = Boolean(collapsedKeys[collapseKey]);
                    const catItems = marketItems.filter((i) => (i.category || 'Outros') === cat);

                    const catBought = catItems.filter((i) => i.status === 'Comprado').length;

                    return (
                      <div key={collapseKey}>
                        {/* Collapsible category header */}
                        <button
                          type="button"
                          onClick={() => toggleCategoryCollapse(collapseKey)}
                          className="w-full flex items-center gap-2 mb-2 group"
                        >
                          {isCollapsed ? (
                            <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                          ) : (
                            <ChevronDown size={13} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">
                            {cat}
                          </span>
                          <span className="text-[10px] text-slate-700 font-normal">
                            {catBought}/{catItems.length}
                          </span>
                          <div className="h-px bg-slate-800/60 flex-1" />
                        </button>

                        {!isCollapsed && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {catItems.map((item) => (
                              <ShoppingItemCard
                                key={item.id}
                                item={item}
                                onToggleBought={handleToggleBought}
                                onPostpone={handlePostpone}
                                onEdit={(i) => setEditingItem(i)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
        onItemAdded={handleItemAdded}
      />

      {/* Edit Item Sheet Modal */}
      {editingItem && (
        <EditShoppingItemSheet
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          availableMarkets={allMarkets}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </div>
  );
}
