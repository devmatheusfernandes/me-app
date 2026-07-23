import { ShoppingBag, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MarketThermometerCardProps {
  limiteAjustado: number;
  rollover: number;
  gastoMercado: number;
  disponivelMercado: number;
  progressPct: number;
}

export function MarketThermometerCard({
  limiteAjustado,
  rollover,
  gastoMercado,
  disponivelMercado,
  progressPct,
}: MarketThermometerCardProps) {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-blue-400" />
          <h3 className="font-semibold text-slate-200 text-sm">Termômetro do Mercado</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Limite Ajustado
          </p>
          <p className="text-base font-bold text-slate-100">
            {formatCurrency(limiteAjustado)}
          </p>
        </div>
      </div>

      {/* Rollover explanation */}
      {rollover !== 0 && (
        <div
          className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
            rollover > 0
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {rollover > 0 ? (
            <TrendingUp size={13} className="shrink-0" />
          ) : (
            <TrendingDown size={13} className="shrink-0" />
          )}
          <span>
            {rollover > 0
              ? `Sobrou R$ ${Math.abs(rollover).toFixed(2).replace('.', ',')} no mês anterior → limite aumentou`
              : `Estourou R$ ${Math.abs(rollover).toFixed(2).replace('.', ',')} no mês anterior → limite reduziu`}
          </span>
        </div>
      )}

      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden mb-3 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progressPct > 80
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-blue-600 to-blue-400'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <p className="text-slate-400">
          Gasto: <span className="text-slate-200 font-semibold">{formatCurrency(gastoMercado)}</span>
        </p>
        <p className="text-slate-400">
          Disponível:{' '}
          <span
            className={`font-semibold ${
              disponivelMercado < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatCurrency(disponivelMercado)}
          </span>
        </p>
      </div>
    </div>
  );
}
