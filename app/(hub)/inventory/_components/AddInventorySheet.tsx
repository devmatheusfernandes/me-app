'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddInventoryItemSchema, type AddInventoryItemInput } from '@/modules/inventory/inventory.schema';
import { addInventoryItemAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface AddInventorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddInventorySheet({ isOpen, onClose }: AddInventorySheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddInventoryItemInput>({
    resolver: zodResolver(AddInventoryItemSchema),
    defaultValues: {
      category: 'Mercearia',
      unit: 'UN',
      current_qty: 1,
      min_qty: 1,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AddInventoryItemInput) => {
    onClose();
    toast.success('Item adicionado ao estoque!');

    try {
      const res = await addInventoryItemAction(data);
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
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-100">Novo Item no Estoque</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nome do Produto
            </label>
            <input
              type="text"
              placeholder="ex: Arroz 5kg, Detergente"
              {...register('name')}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categoria
              </label>
              <select
                {...register('category')}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="Mercearia">Mercearia</option>
                <option value="Doces e Snacks">Doces e Snacks</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Frios e Laticínios">Frios e Laticínios</option>
                <option value="Higiene Pessoal">Higiene Pessoal</option>
                <option value="Padaria">Padaria</option>
                <option value="Carnes">Carnes</option>
                <option value="Congelados">Congelados</option>
                <option value="Utilidades">Utilidades</option>
                <option value="Casa">Casa</option>
                <option value="Outros">Outros</option>
              </select>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quantidade Atual
              </label>
              <input
                type="number"
                step="0.1"
                {...register('current_qty', { valueAsNumber: true })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quantidade Mínima
              </label>
              <input
                type="number"
                step="0.1"
                {...register('min_qty', { valueAsNumber: true })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-sm mt-4 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Adicionar ao Estoque'}
          </button>
        </form>
      </div>
    </div>
  );
}
