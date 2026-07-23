'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PromoPurchaseSchema, type PromoPurchaseInput } from '@/modules/inventory/inventory.schema';
import { promoPurchaseAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import { Tag, Loader2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { InventoryItem } from '@/types';

interface PromoPurchaseSheetProps {
  item: InventoryItem | null;
  selectedMonth: string;
  onClose: () => void;
}

export function PromoPurchaseSheet({ item, selectedMonth, onClose }: PromoPurchaseSheetProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-md bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Tag size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Compra por Promoção</h3>
              <p className="text-xs text-slate-500">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Esta compra irá atualizar o estoque de <strong className="text-slate-200">{item.name}</strong> e abater o valor total diretamente do orçamento do mês atual.
        </p>

        <PromoForm item={item} selectedMonth={selectedMonth} onClose={onClose} />
      </div>
    </div>
  );
}

function PromoForm({
  item,
  selectedMonth,
  onClose,
}: {
  item: InventoryItem;
  selectedMonth: string;
  onClose: () => void;
}) {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromoPurchaseInput>({
    resolver: zodResolver(PromoPurchaseSchema),
    defaultValues: {
      inventory_id: item.id!,
      item_name: item.name,
      qty: 1,
      price: 0,
      target_month: selectedMonth,
    },
  });

  const qty = watch('qty') || 0;
  const price = watch('price') || 0;
  const total = qty * price;

  const onSubmit = async (data: PromoPurchaseInput) => {
    const res = await promoPurchaseAction(data);
    if (res?.data?.success) {
      toast.success(
        `Compra registrada! ${formatCurrency(total)} abatido do orçamento de ${selectedMonth}.`
      );
      onClose();
    } else {
      toast.error('Erro ao registrar compra por promoção');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Qtd Comprada
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            {...register('qty', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.qty && <p className="text-xs text-rose-500 mt-1">{errors.qty.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Preço Unit. (R$)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('price', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <span className="text-xs font-semibold text-amber-400">Total a Abater</span>
        <span className="font-bold text-amber-400">{formatCurrency(total)}</span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-3.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Compra'}
      </button>
    </form>
  );
}
