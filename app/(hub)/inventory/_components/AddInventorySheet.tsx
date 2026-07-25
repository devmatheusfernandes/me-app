'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddInventoryItemSchema, type AddInventoryItemInput } from '@/modules/inventory/inventory.schema';
import { addInventoryItemAction, searchInventoryItemsAction } from '@/modules/inventory/inventory.actions';
import { toast } from 'sonner';
import { Loader2, X, Search } from 'lucide-react';

interface InventorySuggestion {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface AddInventorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddInventorySheet({ isOpen, onClose }: AddInventorySheetProps) {
  const [suggestions, setSuggestions] = useState<InventorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
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

  const nameValue = watch('name') || '';

  // Debounced inventory search for suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (nameValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
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
    setShowSuggestions(false);
    setSuggestions([]);
  };

  if (!isOpen) return null;

  const onSubmit = async (data: AddInventoryItemInput) => {
    onClose();
    reset();
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
          {/* Nome com autocomplete */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nome do Produto
            </label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="ex: Arroz 5kg, Detergente"
                autoComplete="off"
                {...register('name')}
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
