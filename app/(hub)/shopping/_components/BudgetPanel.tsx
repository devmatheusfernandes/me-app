import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetPanelProps {
  limiteBase: number;
  rollover: number;
  totalGasto: number;
}

export function BudgetPanel({ limiteBase, rollover, totalGasto }: BudgetPanelProps) {
  const limiteAjustado = limiteBase + rollover;
  const disponivel = limiteAjustado - totalGasto;
  const progressPct = Math.min((totalGasto / (limiteAjustado || 1)) * 100, 100);
  const isOverBudget = totalGasto > limiteAjustado;

  return (
    <div className="pt-2 mb-4">
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg">
        {/* Limit row */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Limite do Mês
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                rollover >= 0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}
            >
              {rollover >= 0 ? `+${formatCurrency(rollover)} rollover` : `${formatCurrency(rollover)} rollover`}
            </span>
            <span className="font-bold text-sm text-slate-100">
              {formatCurrency(limiteAjustado)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget
                ? 'bg-rose-500'
                : progressPct > 75
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Spent / Available chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800/50 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">
              Gasto
            </span>
            <div className="flex items-center gap-1">
              <TrendingDown size={12} className="text-rose-400" />
              <span className="font-bold text-sm text-slate-200">
                {formatCurrency(totalGasto)}
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl p-2.5 border flex flex-col items-center ${
              isOverBudget
                ? 'bg-rose-500/10 border-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <span
              className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${
                isOverBudget ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              Disponível
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp
                size={12}
                className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}
              />
              <span
                className={`font-bold text-sm ${
                  isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(Math.abs(disponivel))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
