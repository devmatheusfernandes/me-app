'use client';

import { useState } from 'react';
import { X, Save, Trash2, AlertTriangle, Package, Loader2, Minus, Plus } from 'lucide-react';
import { updateInventoryMinQtyAction, deleteInventoryItemAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types';

interface InventoryDetailSheetProps {
  item: InventoryItem | null;
  onClose: () => void;
  onUpdated?: (id: string, newMinQty: number) => void;
  onDeleted?: (id: string) => void;
}

export function InventoryDetailSheet({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: InventoryDetailSheetProps) {
  if (!item) return null;

  return (
    <InventoryDetailSheetForm
      key={item.id}
      item={item}
      onClose={onClose}
      onUpdated={onUpdated}
      onDeleted={onDeleted}
    />
  );
}

function InventoryDetailSheetForm({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: InventoryItem;
  onClose: () => void;
  onUpdated?: (id: string, newMinQty: number) => void;
  onDeleted?: (id: string) => void;
}) {
  const [minQty, setMinQty] = useState(item.min_qty);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLow = item.current_qty <= minQty;

  const handleSaveMinQty = async () => {
    if (minQty < 0) {
      toast.error('A quantidade mínima não pode ser negativa');
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateInventoryMinQtyAction({ id: item.id!, min_qty: minQty });
      if (res?.data?.success) {
        toast.success(`Quantidade mínima de "${item.name}" atualizada para ${minQty} ${item.unit}`);
        onUpdated?.(item.id!, minQty);
        onClose();
      } else {
        toast.error('Erro ao salvar no servidor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!confirm(`Tem certeza que deseja remover "${item.name}" do estoque?`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteInventoryItemAction({ id: item.id! });
      if (res?.data?.success) {
        toast.success(`Item "${item.name}" removido do estoque.`);
        onDeleted?.(item.id!);
        onClose();
      } else {
        toast.error('Erro ao remover item');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.category || 'Dispensa'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {/* Overview status box */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLow ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Estoque Atual
            </p>
            <p className="text-2xl font-bold text-slate-100">
              {item.current_qty} <span className="text-sm text-slate-400 font-normal">{item.unit}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Status do Estoque
            </p>
            {isLow ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 mt-1">
                <AlertTriangle size={14} /> Estoque Baixo
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 mt-1">Estoque OK</span>
            )}
          </div>
        </div>

        {/* Edit Minimum Quantity Threshold */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Quantidade Mínima Alvo (Alerta)
            </label>
            <p className="text-xs text-slate-500">
              Quando a quantidade no estoque for menor ou igual a este valor, o aplicativo marcará como estoque baixo.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMinQty((prev) => Math.max(0, prev - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
              >
                <Minus size={18} />
              </button>

              <input
                type="number"
                min="0"
                value={minQty}
                onChange={(e) => setMinQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center font-bold text-lg bg-transparent text-slate-100 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setMinQty((prev) => prev + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">{item.unit}</span>
          </div>
        </div>

        {/* Last updated date info */}
        {item.last_updated && (
          <p className="text-[11px] text-slate-600 text-center">
            Última atualização em: {new Date(item.last_updated).toLocaleDateString('pt-BR')}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting || isSaving}
            onClick={handleDeleteItem}
            className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl py-3.5 text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Excluir Item
          </button>

          <button
            type="button"
            disabled={isSaving || isDeleting}
            onClick={handleSaveMinQty}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Mínimo
          </button>
        </div>
      </div>
    </div>
  );
}
