'use client';

import { AlertTriangle, Calendar, CalendarClock } from 'lucide-react';
import { addToShoppingListFromInventoryAction } from '@/modules/inventory/inventory.actions';
import { getNextMonthYear } from '@/lib/utils';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types';

interface LowStockDialogProps {
  item: InventoryItem | null;
  selectedMonth: string;
  onClose: () => void;
}

export function LowStockDialog({ item, selectedMonth, onClose }: LowStockDialogProps) {
  if (!item) return null;

  const handleAdd = async (targetMonth: string) => {
    try {
      const res = await addToShoppingListFromInventoryAction({
        inventory_id: item.id!,
        name: item.name,
        category: item.category,
        target_month: targetMonth,
      });

      if (res?.data?.success) {
        toast.success(
          targetMonth === selectedMonth
            ? `${item.name} adicionado à lista deste mês!`
            : `${item.name} adicionado à lista do próximo mês!`
        );
      } else {
        toast.error('Erro ao adicionar item à lista');
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor');
    } finally {
      onClose();
    }
  };

  const nextMonth = getNextMonthYear(selectedMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-md bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{item.name} no mínimo!</h3>
            <p className="text-xs text-slate-500">Adicionar à lista de compras?</p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-5 mt-3 leading-relaxed">
          Adicionar <strong className="text-slate-200">{item.name}</strong> à lista de compras de qual mês?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAdd(selectedMonth)}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            <Calendar size={20} />
            Este mês
          </button>
          <button
            onClick={() => handleAdd(nextMonth)}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm active:scale-95 transition-all"
          >
            <CalendarClock size={20} />
            Próximo mês
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 text-slate-500 text-sm font-medium"
        >
          Não adicionar
        </button>
      </div>
    </div>
  );
}
