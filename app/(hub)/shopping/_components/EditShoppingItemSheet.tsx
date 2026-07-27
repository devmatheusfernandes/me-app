'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditShoppingItemSchema, type EditShoppingItemInput } from '@/modules/shopping/shopping.schema';
import { editShoppingItemAction } from '@/modules/shopping/shopping.actions';
import { searchInventoryItemsAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import { Loader2, X, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ShoppingItem } from '@/types';

interface InventorySuggestion {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_qty?: number;
}

interface EditShoppingItemSheetProps {
  item: ShoppingItem;
  isOpen: boolean;
  onClose: () => void;
  availableMarkets?: string[];
  onItemUpdated?: (item: ShoppingItem) => void;
}

export function EditShoppingItemSheet({
  item,
  isOpen,
  onClose,
  availableMarkets = ['Cooper A1', 'Supermercado Veneza', 'Atacadão', 'Outros'],
  onItemUpdated,
}: EditShoppingItemSheetProps) {
  const [suggestions, setSuggestions] = useState<InventorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditShoppingItemInput>({
    resolver: zodResolver(EditShoppingItemSchema),
    defaultValues: {
      itemId: item.id,
      name: item.name,
      market_name: item.market_name || availableMarkets[0],
      category: (item.category as any) || 'Mercearia',
      qty: item.qty,
      unit: (item.unit as any) || 'UN',
      estimated_unit_price: item.estimated_unit_price || 0,
      target_month: item.target_month,
    },
  });

  // Reset form when item changes
  useEffect(() => {
    if (item && isOpen) {
      reset({
        itemId: item.id,
        name: item.name,
        market_name: item.market_name || availableMarkets[0],
        category: (item.category as any) || 'Mercearia',
        qty: item.qty,
        unit: (item.unit as any) || 'UN',
        estimated_unit_price: item.estimated_unit_price || 0,
        target_month: item.target_month,
      });
    }
  }, [item, isOpen, reset, availableMarkets]);

  const nameValue = useWatch({ control, name: 'name', defaultValue: '' }) || '';
  const qty = useWatch({ control, name: 'qty', defaultValue: 0 }) || 0;
  const unitPrice = useWatch({ control, name: 'estimated_unit_price', defaultValue: 0 }) || 0;
  const totalCalculated = qty * unitPrice;

  // Debounced search for inventory suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (nameValue.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const res = await searchInventoryItemsAction({ query: nameValue });
        if (res?.data?.items) {
          setSuggestions(res.data.items);
          setShowSuggestions(res.data.items.length > 0);
        }
      } catch {
        // Silently ignore search errors
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameValue]);

  const handleSelectSuggestion = (s: InventorySuggestion) => {
    setValue('name', s.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue('category', (s.category || 'Mercearia') as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue('unit', (s.unit || 'UN') as any);
    if (s.min_qty !== undefined) {
      setValue('min_qty', s.min_qty);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  if (!isOpen) return null;

  const onSubmit = async (data: EditShoppingItemInput) => {
    // Optimistic update
    const totalPrice = Number(data.qty) * Number(data.estimated_unit_price || 0);
    const optimisticItem: ShoppingItem = {
      ...item,
      name: data.name,
      market_name: data.market_name,
      category: (data.category || 'Mercearia') as any,
      qty: data.qty,
      unit: (data.unit || 'UN') as any,
      estimated_unit_price: data.estimated_unit_price || 0,
      total_price: totalPrice,
      target_month: data.target_month,
    };

    onItemUpdated?.(optimisticItem);
    onClose();
    toast.success('Item atualizado com sucesso!');

    try {
      const res = await editShoppingItemAction(data);
      if (!res?.data?.success) {
        toast.error('Erro ao atualizar item no servidor');
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
          <h3 className="font-bold text-lg text-slate-100">Editar Item</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Nome com autocomplete */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nome do Produto
            </label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="ex: Arroz, Leite Integral"
                {...register('name')}
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-sm text-slate-200">{s.name}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">{s.category}</span>
                  </button>
                ))}
              </div>
            )}
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
                <option value="Bebidas">Bebidas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" title="Estoque mínimo desejado para sempre avisar quando faltar">
                Mínimo
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                {...register('min_qty', { valueAsNumber: true })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none text-center"
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
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
