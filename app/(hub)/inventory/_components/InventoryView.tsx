'use client';

import { useState } from 'react';
import { Plus, Search, AlertTriangle, ChevronDown, ChevronRight, ShoppingCart, X, Loader2, Barcode } from 'lucide-react';
import { InventoryItemCard } from './InventoryItemCard';
import { LowStockDialog } from './LowStockDialog';
import { AddInventorySheet } from './AddInventorySheet';
import { BarcodeScanner } from '@/components/qr/BarcodeScanner';
import { InventoryDetailSheet } from './InventoryDetailSheet';
import { updateInventoryQtyAction } from '@/modules/inventory/inventory.actions';
import { addToShoppingListFromInventoryAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types';

interface AddToShoppingModalProps {
  item: InventoryItem;
  selectedMonth: string;
  onClose: () => void;
}

function AddToShoppingModal({ item, selectedMonth, onClose }: AddToShoppingModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await addToShoppingListFromInventoryAction({
        inventory_id: item.id!,
        name: item.name,
        category: item.category,
        target_month: selectedMonth,
      });
      if (res?.data?.success) {
        toast.success(`"${item.name}" adicionado à lista de compras de ${selectedMonth}!`);
        onClose();
      } else {
        toast.error('Erro ao adicionar à lista');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <ShoppingCart size={22} className="text-blue-400" />
        </div>

        <h3 className="font-bold text-base text-slate-100 mb-1">Adicionar à Lista</h3>
        <p className="text-sm text-slate-400 mb-5">
          Adicionar <span className="text-slate-200 font-semibold">&quot;{item.name}&quot;</span> à lista de compras de <span className="text-blue-400 font-semibold">{selectedMonth}</span>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-semibold text-sm hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

interface InventoryViewProps {
  initialItems: InventoryItem[];
  selectedMonth: string;
}

export function InventoryView({ initialItems, selectedMonth }: InventoryViewProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockDialogItem, setLowStockDialogItem] = useState<InventoryItem | null>(null);
  const [addToShoppingItem, setAddToShoppingItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedProductData, setScannedProductData] = useState<any>(null);

  const handleBarcodeDecoded = async (ean: string) => {
    setShowBarcodeScanner(false);
    const toastId = toast.loading('Buscando produto no catálogo...');
    try {
      const res = await fetch(`/api/barcode/${ean}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(`Produto localizado: ${data.name}`, { id: toastId });
        setScannedProductData({
          name: data.name,
          category: data.category,
          unit: data.unit,
          current_qty: 1,
          min_qty: 1,
        });
        setIsAddOpen(true);
      } else {
        toast.error(data.error || 'Produto não cadastrado. Preencha manualmente.', { id: toastId });
        setScannedProductData(null);
        setIsAddOpen(true);
      }
    } catch {
      toast.error('Erro de conexão ao buscar produto.', { id: toastId });
      setScannedProductData(null);
      setIsAddOpen(true);
    }
  };

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
        <div className="flex gap-2">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 active:scale-90 transition-all hover:text-white"
            title="Escanear Código de Barras"
          >
            <Barcode size={20} />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 active:scale-90 transition-all hover:text-white"
          >
            <Plus size={20} />
          </button>
        </div>
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
                        onAddToShopping={(itm) => setAddToShoppingItem(itm)}
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

      {addToShoppingItem && (
        <AddToShoppingModal
          item={addToShoppingItem}
          selectedMonth={selectedMonth}
          onClose={() => setAddToShoppingItem(null)}
        />
      )}

      <InventoryDetailSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdated={handleItemMinQtyUpdated}
        onDeleted={handleItemDeleted}
      />

      <AddInventorySheet
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setScannedProductData(null);
        }}
        initialData={scannedProductData}
      />

      {showBarcodeScanner && (
        <BarcodeScanner
          onCancel={() => setShowBarcodeScanner(false)}
          onDecoded={handleBarcodeDecoded}
        />
      )}
    </div>
  );
}
