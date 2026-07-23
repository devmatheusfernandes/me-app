'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddShoppingItemSchema, type AddShoppingItemInput } from '@/modules/shopping/shopping.schema';
import { addShoppingItemAction } from '@/modules/shopping/shopping.actions';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AddShoppingItemSheetProps {
  selectedMonth: string;
  isOpen: boolean;
  onClose: () => void;
  availableMarkets?: string[];
}

export function AddShoppingItemSheet({
  selectedMonth,
  isOpen,
  onClose,
  availableMarkets = ['Cooper A1', 'Supermercado Veneza', 'Atacadão', 'Outros'],
}: AddShoppingItemSheetProps) {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddShoppingItemInput>({
    resolver: zodResolver(AddShoppingItemSchema),
    defaultValues: {
      market_name: availableMarkets[0] || 'Cooper A1',
      category: 'Mercearia',
      qty: 1,
      unit: 'UN',
      estimated_unit_price: 0,
      target_month: selectedMonth,
    },
  });

  const qty = watch('qty') || 0;
  const unitPrice = watch('estimated_unit_price') || 0;
  const totalCalculated = qty * unitPrice;

  if (!isOpen) return null;

  const onSubmit = async (data: AddShoppingItemInput) => {
    onClose();
    toast.success('Item adicionado à lista de compras!');

    try {
      const res = await addShoppingItemAction(data);
      if (!res?.data?.success) {
        toast.error('Erro ao salvar item no servidor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-100">Novo Item de Compra</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nome do Produto
            </label>
            <input
              type="text"
              placeholder="ex: Arroz, Leite Integral"
              {...register('name')}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mercado
              </label>
              <select
                {...register('market_name')}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {availableMarkets.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categoria
              </label>
              <select
                {...register('category')}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="Mercearia">Mercearia</option>
                <option value="Frios e Laticínios">Laticínios</option>
                <option value="Carnes">Carnes</option>
                <option value="Higiene Pessoal">Higiene</option>
                <option value="Utilidades">Limpeza</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Doces e Snacks">Doces</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Qtd
              </label>
              <input
                type="number"
                step="0.1"
                {...register('qty', { valueAsNumber: true })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none text-center"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unidade
              </label>
              <select
                {...register('unit')}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="PCT">PCT</option>
                <option value="CX">CX</option>
                <option value="L">L</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                R$ Unit.
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('estimated_unit_price', { valueAsNumber: true })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-calculated total */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-xs font-semibold text-blue-400">Total calculado</span>
            <span className="font-bold text-blue-400">{formatCurrency(totalCalculated)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Adicionar à Lista'}
          </button>
        </form>
      </div>
    </div>
  );
}
