'use client';

import { useState } from 'react';
import { closeMonthAction } from '@/modules/finance/finance.actions';
import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatMonthYearLabel } from '@/lib/utils';

interface CloseMonthButtonProps {
  monthYear: string;
}

export function CloseMonthButton({ monthYear }: CloseMonthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [closedResult, setClosedResult] = useState<{
    nextMonth: string;
    newRollover: number;
    nextLimit: number;
  } | null>(null);

  const handleCloseMonth = async () => {
    setLoading(true);
    try {
      const res = await closeMonthAction({ monthYear });
      if (res?.data?.success) {
        setClosedResult({
          nextMonth: res.data.nextMonth,
          newRollover: res.data.newRollover,
          nextLimit: res.data.nextLimit,
        });
        toast.success(`Mês ${formatMonthYearLabel(monthYear)} fechado com sucesso!`);
      } else {
        toast.error(res?.serverError || 'Erro ao fechar o mês');
      }
    } catch {
      toast.error('Erro ao fechar o mês');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleCloseMonth}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
          closedResult
            ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 shadow-emerald-500/10'
            : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 shadow-black/20'
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin text-blue-400" /> Fechando mês...
          </>
        ) : closedResult ? (
          <>
            <CheckCircle2 size={18} className="text-emerald-400" /> Mês Fechado — Rollover calculado
          </>
        ) : (
          <>
            <CalendarCheck size={18} /> Fechar o Mês
          </>
        )}
      </button>

      {closedResult && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400 animate-in fade-in duration-300">
          <p className="font-semibold mb-1">Rollover calculado!</p>
          <p className="text-emerald-400/70 text-xs">
            {closedResult.newRollover >= 0 ? 'Sobrou' : 'Estourou'}{' '}
            <strong className="text-emerald-400">
              {formatCurrency(Math.abs(closedResult.newRollover))}
            </strong>{' '}
            no mercado. O limite de {formatMonthYearLabel(closedResult.nextMonth)} será de{' '}
            <strong className="text-emerald-400">{formatCurrency(closedResult.nextLimit)}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
