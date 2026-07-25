import { ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, Target, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FinancialSummaryCardProps {
  receitas: number;
  outrasDepesas: number;
  reservadoMetas: number;
  despesasFixasTotal: number;
  despesasFixasPagas: number;
  despesasFixasPendentes: number;
  despesasPontuaisTotal: number;
  despesasPontuaisPagas: number;
  despesasPontuaisPendentes: number;
  saldoLivre: number;
}

export function FinancialSummaryCard({
  receitas,
  outrasDepesas,
  reservadoMetas,
  despesasFixasTotal,
  despesasFixasPagas,
  despesasFixasPendentes,
  despesasPontuaisTotal,
  despesasPontuaisPagas,
  despesasPontuaisPendentes,
  saldoLivre,
}: FinancialSummaryCardProps) {
  return (
    <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 relative z-10">
        Resumo Financeiro
      </p>

      {/* Receitas */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ArrowUpRight size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Receitas Totais
            </p>
            <p className="text-base font-bold text-emerald-400">
              {formatCurrency(receitas)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-800 mb-3" />

      {/* Despesas Fixas */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
            <ArrowDownRight size={16} className="text-rose-400" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Despesas Fixas
            </p>
            <p className="text-base font-bold text-rose-400">
              {formatCurrency(despesasFixasTotal)}
            </p>
          </div>
        </div>
        <div className="text-right mt-0.5">
          <div className="flex items-center gap-1 justify-end mb-0.5">
            <CheckCircle2 size={11} className="text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-500">
              {formatCurrency(despesasFixasPagas)}
            </span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Circle size={11} className="text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-400">
              {formatCurrency(despesasFixasPendentes)}
            </span>
          </div>
        </div>
      </div>

      {/* Despesas Pontuais */}
      {despesasPontuaisTotal > 0 && (
        <>
          <div className="h-px bg-slate-800/60 mb-3" />
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ArrowDownRight size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Despesas Pontuais
                </p>
                <p className="text-base font-bold text-amber-400">
                  {formatCurrency(despesasPontuaisTotal)}
                </p>
              </div>
            </div>
            <div className="text-right mt-0.5">
              <div className="flex items-center gap-1 justify-end mb-0.5">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-500">
                  {formatCurrency(despesasPontuaisPagas)}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Circle size={11} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400">
                  {formatCurrency(despesasPontuaisPendentes)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Outras Despesas avulsas */}
      {outrasDepesas > 0 && (
        <>
          <div className="h-px bg-slate-800/60 mb-3" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                <ShoppingBag size={16} className="text-orange-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Outras Despesas
                </p>
                <p className="text-base font-bold text-orange-400">
                  {formatCurrency(outrasDepesas)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reservado para Metas */}
      {reservadoMetas > 0 && (
        <>
          <div className="h-px bg-slate-800/60 mb-3" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Target size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Reservado (Metas)
                </p>
                <p className="text-base font-bold text-purple-400">
                  {formatCurrency(reservadoMetas)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-slate-800 mb-4" />

      {/* Saldo Livre */}
      <div className="flex items-center justify-between relative z-10">
        <p className="text-sm font-semibold text-slate-400">Saldo Livre</p>
        <p className={`text-2xl font-bold tracking-tight ${saldoLivre >= 0 ? 'text-white' : 'text-rose-400'}`}>
          {formatCurrency(saldoLivre)}
        </p>
      </div>
    </div>
  );
}
