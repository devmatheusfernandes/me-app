'use client';

import { useState } from 'react';
import { Plus, Search, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { InventoryItemCard } from './InventoryItemCard';
import { LowStockDialog } from './LowStockDialog';
import { PromoPurchaseSheet } from './PromoPurchaseSheet';
import { AddInventorySheet } from './AddInventorySheet';
import { InventoryDetailSheet } from './InventoryDetailSheet';
import { updateInventoryQtyAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types';

interface InventoryViewProps {
  initialItems: InventoryItem[];
  selectedMonth: string;
}

export function InventoryView({ initialItems, selectedMonth }: InventoryViewProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockDialogItem, setLowStockDialogItem] = useState<InventoryItem | null>(null);
  const [promoSheetItem, setPromoSheetItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Track collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (categoryName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowItems = items.filter((i) => i.current_qty <= i.min_qty);
  const categories = Array.from(new Set(filteredItems.map((i) => i.category || 'Dispensa')));

  const handleUpdateQty = async (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;

    const oldQty = currentItem.current_qty;
    const newQty = Math.max(0, oldQty + delta);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, current_qty: newQty } : item))
    );

    // Trigger low stock dialog if hitting minimum threshold
    if (newQty <= currentItem.min_qty && oldQty > currentItem.min_qty) {
      setLowStockDialogItem({ ...currentItem, current_qty: newQty });
    }

    try {
      const res = await updateInventoryQtyAction({ id, delta });
      if (!res?.data?.success) {
        toast.error('Erro ao atualizar quantidade no servidor');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleItemMinQtyUpdated = (id: string, newMinQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, min_qty: newMinQty } : item))
    );
  };

  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-5 pb-6">
      {/* Header */}
      <div className="pt-2 mb-5 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
            Módulo
          </p>
          <h1 className="text-2xl font-bold text-slate-50">Estoque de Casa</h1>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 active:scale-90 transition-all hover:text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Low stock alert box */}
      {lowItems.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-5 flex items-start gap-3 shadow-sm">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-400 text-sm">
              {lowItems.length} {lowItems.length === 1 ? 'item abaixo' : 'itens abaixo'} do mínimo
            </h3>
            <p className="text-xs text-rose-400/70 mt-0.5">
              {lowItems.map((i) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Items by Category */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center text-xs text-slate-500">
          Nenhum item encontrado no estoque.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const isCollapsed = Boolean(collapsedCategories[cat]);
            const catItems = filteredItems.filter((i) => (i.category || 'Dispensa') === cat);

            return (
              <div key={cat} className="space-y-3">
                {/* Collapsible Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="w-full flex items-center justify-between text-left group py-1"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    )}
                    <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-widest transition-colors">
                      {cat} <span className="text-slate-600 font-normal">({catItems.length})</span>
                    </p>
                  </div>
                  <div className="h-px bg-slate-800/80 flex-1 ml-3" />
                </button>

                {/* Grid of items (collapsible) */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {catItems.map((item) => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        onUpdateQty={handleUpdateQty}
                        onOpenPromo={(itm) => setPromoSheetItem(itm)}
                        onOpenDetail={(itm) => setDetailItem(itm)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs & Sheets */}
      <LowStockDialog
        item={lowStockDialogItem}
        selectedMonth={selectedMonth}
        onClose={() => setLowStockDialogItem(null)}
      />

      <PromoPurchaseSheet
        item={promoSheetItem}
        selectedMonth={selectedMonth}
        onClose={() => setPromoSheetItem(null)}
      />

      <InventoryDetailSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdated={handleItemMinQtyUpdated}
        onDeleted={handleItemDeleted}
      />

      <AddInventorySheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
