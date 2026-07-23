import React, { useState } from 'react';
import { AppLayout } from './AppLayout';
import { Plus, Minus, Search, AlertTriangle, ShoppingCart, Filter, Tag, X, Calendar, CalendarClock } from 'lucide-react';

interface InventoryItem {
  id: string; name: string; category: string; current: number; min: number; unit: string;
}

const INITIAL: InventoryItem[] = [
  { id: '1', name: 'Arroz',           category: 'Dispensa', current: 0,  min: 1, unit: '2kg' },
  { id: '2', name: 'Feijão',          category: 'Dispensa', current: 0,  min: 1, unit: '0.5kg' },
  { id: '3', name: 'Café',            category: 'Dispensa', current: 1,  min: 1, unit: '300g' },
  { id: '4', name: 'Leite',           category: 'Dispensa', current: 1,  min: 3, unit: '1L' },
  { id: '5', name: 'Papel Higiênico', category: 'Higiene',  current: 1,  min: 2, unit: '4un' },
  { id: '6', name: 'Detergente',      category: 'Limpeza',  current: 2,  min: 1, unit: '1un' },
  { id: '7', name: 'Sabonete',        category: 'Higiene',  current: 5,  min: 3, unit: '1un' },
];

type DialogType = 'addToList' | 'promo' | null;

interface DialogState {
  type: DialogType;
  item: InventoryItem | null;
}

function InventoryContent() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL);
  const [dialog, setDialog] = useState<DialogState>({ type: null, item: null });
  const [promoPrice, setPromoPrice] = useState('');
  const [promoQty, setPromoQty] = useState('1');
  const [addedToast, setAddedToast] = useState('');

  const lowItems = items.filter(i => i.current <= i.min);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(0, item.current + delta);
      // When hitting minimum, trigger dialog
      if (newQty <= item.min && item.current > item.min) {
        setDialog({ type: 'addToList', item: { ...item, current: newQty } });
      }
      return { ...item, current: newQty };
    }));
  };

  const toast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const handleAddToList = (when: 'now' | 'next') => {
    toast(when === 'now'
      ? `${dialog.item?.name} adicionado à lista deste mês!`
      : `${dialog.item?.name} será adicionado ao próximo mês.`);
    setDialog({ type: null, item: null });
  };

  const handlePromoConfirm = () => {
    const qty = parseInt(promoQty) || 1;
    const price = parseFloat(promoPrice.replace(',', '.')) || 0;
    if (dialog.item) {
      setItems(prev => prev.map(i => i.id === dialog.item!.id ? { ...i, current: i.current + qty } : i));
      toast(`Compra antecipada registrada! -R$ ${(qty * price).toFixed(2).replace('.', ',')} do orçamento atual.`);
    }
    setDialog({ type: null, item: null });
    setPromoPrice('');
    setPromoQty('1');
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="p-5 pb-32 relative">

      {/* Header */}
      <div className="pt-2 mb-5 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Módulo</p>
          <h1 className="text-2xl font-bold text-slate-50">Estoque de Casa</h1>
        </div>
        <button className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 active:scale-90 transition-all">
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar item..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <Filter size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      {/* Low stock alert */}
      {lowItems.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-400 text-sm">
              {lowItems.length} {lowItems.length === 1 ? 'item abaixo' : 'itens abaixo'} do mínimo
            </h3>
            <p className="text-xs text-rose-400/70 mt-0.5">
              {lowItems.map(i => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Item list by category */}
      <div className="space-y-7">
        {categories.map(cat => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</p>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <div className="space-y-2.5">
              {items.filter(i => i.category === cat).map(item => {
                const isLow = item.current <= item.min;
                return (
                  <div key={item.id} className={`bg-slate-900 rounded-2xl border transition-colors ${isLow ? 'border-rose-500/20' : 'border-slate-800'}`}>
                    {/* Main row */}
                    <div className="flex justify-between items-center p-4">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-slate-200 truncate">{item.name}</p>
                          {isLow && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
                              Baixo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">Mín: {item.min} {item.unit}</p>
                      </div>

                      {/* Large stepper */}
                      <div className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
                        >
                          <Minus size={18} />
                        </button>
                        <span className={`w-6 text-center font-bold text-lg ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                          {item.current}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Promo button */}
                    <button
                      onClick={() => setDialog({ type: 'promo', item })}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-slate-800/60 text-xs font-semibold text-amber-400 hover:bg-amber-500/5 transition-colors rounded-b-2xl"
                    >
                      <Tag size={13} className="text-amber-400" />
                      Registrar Compra por Promoção
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Toast notification */}
      {addedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-2xl text-sm font-semibold text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 max-w-[340px] text-center">
          {addedToast}
        </div>
      )}

      {/* ── Dialog: Add to shopping list ── */}
      {dialog.type === 'addToList' && dialog.item && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center" style={{ maxWidth: '390px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialog({ type: null, item: null })} />
          <div className="relative w-full bg-slate-900 rounded-t-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={18} className="text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{dialog.item.name} no mínimo!</h3>
                <p className="text-xs text-slate-500">Adicionar à lista de compras?</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-5 mt-3 leading-relaxed">
              Adicionar <strong className="text-slate-200">{dialog.item.name}</strong> à lista de compras de qual mês?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAddToList('now')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <Calendar size={20} />
                Este mês
              </button>
              <button
                onClick={() => handleAddToList('next')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm active:scale-95 transition-all"
              >
                <CalendarClock size={20} />
                Próximo mês
              </button>
            </div>
            <button
              onClick={() => setDialog({ type: null, item: null })}
              className="w-full mt-3 py-3 text-slate-500 text-sm font-medium"
            >
              Não adicionar
            </button>
          </div>
        </div>
      )}

      {/* ── Dialog: Quick Promo Purchase ── */}
      {dialog.type === 'promo' && dialog.item && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center" style={{ maxWidth: '390px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialog({ type: null, item: null })} />
          <div className="relative w-full bg-slate-900 rounded-t-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Tag size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">Compra por Promoção</h3>
                  <p className="text-xs text-slate-500">{dialog.item.name}</p>
                </div>
              </div>
              <button onClick={() => setDialog({ type: null, item: null })} className="text-slate-500">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Registra a compra imediatamente: abate do orçamento do <strong className="text-slate-300">mês atual</strong> e atualiza o estoque — sem passar pela lista de compras.
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Quantidade</label>
                <input
                  type="number"
                  value={promoQty}
                  onChange={e => setPromoQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Valor Unitário (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={promoPrice}
                  onChange={e => setPromoPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>
              {promoPrice && (
                <div className="flex justify-between items-center px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="text-xs font-semibold text-amber-400">Total debitado do orçamento</span>
                  <span className="font-bold text-amber-400">
                    R$ {(parseInt(promoQty || '1') * parseFloat(promoPrice.replace(',', '.') || '0')).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handlePromoConfirm}
              className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
            >
              Confirmar Compra e Atualizar Estoque
            </button>
          </div>
        </div>
      )}

      {/* Floating action button */}
      {lowItems.length > 0 && (
        <div className="fixed bottom-[100px] left-0 right-0 px-5 flex justify-center z-40 max-w-[390px] mx-auto">
          <button
            onClick={() => toast(`${lowItems.length} itens adicionados à lista deste mês!`)}
            className="w-full bg-blue-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={18} />
            Adicionar {lowItems.length} {lowItems.length === 1 ? 'item' : 'itens'} em Falta à Lista
          </button>
        </div>
      )}
    </div>
  );
}

export function Inventory() {
  return (
    <AppLayout activeTab="inventory">
      <InventoryContent />
    </AppLayout>
  );
}
