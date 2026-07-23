'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckCircle2, Loader2, Store, AlertCircle } from 'lucide-react';
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
  const [selected, setSelected] = useState<Set<number>>(new Set(scraped.items.map((_, i) => i)));

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

  const selectedItems: NfceItem[] = scraped.items
    .filter((_, i) => selected.has(i))
    .map((item) => ({
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

  const totalSelected = selectedItems.reduce((s, i) => s + i.total_price, 0);

  function handleConfirm() {
    startTransition(async () => {
      const result = await importFromNFCeAction({
        items: selectedItems,
        market_name: marketNameOverride || scraped.market_name,
        target_month: targetMonth,
        total_amount: totalSelected,
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
    <div className="flex flex-col gap-4 h-full">
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
        {scraped.items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggle(idx)}
            className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
              selected.has(idx)
                ? 'bg-slate-800 border-slate-600'
                : 'bg-slate-900/40 border-slate-800/40 opacity-50'
            }`}
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
              <p className="text-xs text-slate-500">
                {item.qty} {item.unit} × {formatCurrency(item.unit_price)}
              </p>
            </div>
            <p className="text-sm font-semibold text-white shrink-0">{formatCurrency(item.total_price)}</p>
          </button>
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
    </div>
  );
}
