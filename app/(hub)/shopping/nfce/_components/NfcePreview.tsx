'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckCircle2, Loader2, Store, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { importFromNFCeAction } from '@/modules/shopping/shopping.actions';
import { toast } from 'sonner';
import type { NfceScrapedResult } from '@/app/api/scrape-nfce/route';
import type { NfceItem } from '@/modules/shopping/shopping.schema';

interface NfcePreviewProps {
  scraped: NfceScrapedResult;
  targetMonth: string;
  marketNameOverride?: string;
  withinMarketMode?: boolean;
}

export function NfcePreview({
  scraped,
  targetMonth,
  marketNameOverride,
  withinMarketMode = false,
}: NfcePreviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Convert scraped items to local state to allow editing
  const [items, setItems] = useState<NfceItem[]>(() =>
    scraped.items.map((item) => ({
      ...item,
      min_qty: 1, // default minimum stock
    }))
  );

  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState<number>(1);
  const [editUnit, setEditUnit] = useState('UN');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMinQty, setEditMinQty] = useState<number>(1);

  const toggle = (idx: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });

  const selectedItems = items.filter((_, i) => selected.has(i));
  const totalSelected = selectedItems.reduce((s, i) => s + i.total_price, 0);

  const handleEditStart = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items[idx];
    setEditingIndex(idx);
    setEditName(item.name);
    setEditQty(item.qty);
    setEditUnit(item.unit);
    setEditPrice(item.unit_price);
    setEditMinQty(item.min_qty ?? 1);
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    setItems((prev) => {
      const next = [...prev];
      const qty = Number(editQty) || 0.01;
      const unitPrice = Number(editPrice) || 0;
      const totalPrice = Number((qty * unitPrice).toFixed(2));
      next[editingIndex] = {
        name: editName.trim(),
        qty,
        unit: editUnit,
        unit_price: unitPrice,
        total_price: totalPrice,
        min_qty: Number(editMinQty) >= 0 ? Number(editMinQty) : 1,
      };
      return next;
    });
    setEditingIndex(null);
  };

  function handleConfirm() {
    startTransition(async () => {
      const result = await importFromNFCeAction({
        items: selectedItems,
        market_name: marketNameOverride || scraped.market_name,
        target_month: targetMonth,
        total_amount: totalSelected,
        note_date: scraped.note_date,
        within_market_mode: withinMarketMode,
      });

      if (result?.data?.success) {
        toast.success(
          withinMarketMode
            ? `${result.data.matchedCount} itens marcados + ${result.data.addedCount} adicionados`
            : `${result.data.addedCount} itens importados como despesas`
        );
        router.push('/shopping');
      } else {
        toast.error('Erro ao importar itens da nota fiscal.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full relative">
      {/* Market header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Store size={20} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Emissor</p>
          <p className="text-sm font-semibold text-white truncate">{scraped.market_name}</p>
          {scraped.note_date && (
            <p className="text-xs text-slate-500">{scraped.note_date}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total NF</p>
          <p className="text-base font-bold text-white">{formatCurrency(scraped.total_amount)}</p>
        </div>
      </div>

      {withinMarketMode && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">
            Modo mercado ativo: itens reconhecidos serão marcados como comprados. Novos itens serão adicionados.
          </p>
        </div>
      )}

      {/* Item list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              selected.has(idx)
                ? 'bg-slate-800 border-slate-600'
                : 'bg-slate-900/40 border-slate-850/40 opacity-50'
            }`}
          >
            <button
              onClick={() => toggle(idx)}
              className="flex items-start gap-3 flex-1 min-w-0 text-left"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  selected.has(idx) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                }`}
              >
                {selected.has(idx) && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>
                    {item.qty} {item.unit} × {formatCurrency(item.unit_price)}
                  </span>
                  {item.min_qty !== undefined && item.min_qty > 0 && (
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                      Estoque Mín: {item.min_qty}
                    </span>
                  )}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <p className="text-sm font-semibold text-white">{formatCurrency(item.total_price)}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleEditStart(idx, e)}
                className="w-8 h-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
              >
                <Pencil size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
        <div className="flex-1">
          <p className="text-xs text-slate-500">{selected.size} itens selecionados</p>
          <p className="text-base font-bold text-white">{formatCurrency(totalSelected)}</p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={isPending || selected.size === 0}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <ShoppingCart size={16} className="mr-2" />
          )}
          {withinMarketMode ? 'Confirmar' : 'Importar como Despesas'}
        </Button>
      </div>

      {/* Edit Modal (Dialog Overlay) */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Editar Item</h3>
              <button
                onClick={() => setEditingIndex(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    value={editQty}
                    onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Unidade</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    {['UN', 'KG', 'G', 'L', 'ML', 'PCT', 'CX'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Preço Unitário</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={editMinQty}
                    onChange={(e) => setEditMinQty(parseInt(e.target.value, 15) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleEditSave}
                disabled={!editName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 shadow-lg shadow-blue-600/20 active:scale-98 transition-all"
              >
                Confirmar Edição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
