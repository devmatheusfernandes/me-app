'use client';

import { FinancialSummaryCard } from './FinancialSummaryCard';
import { MarketThermometerCard } from './MarketThermometerCard';
import { UpcomingBillsCard } from './UpcomingBillsCard';
import { GoalsCard } from './GoalsCard';
import { CloseMonthButton } from './CloseMonthButton';
import type { FixedExpense, Goal } from '@/types';

interface DashboardViewProps {
  data: {
    monthYear: string;
    receitas: number;
    outrasDepesas: number;
    despesasFixasTotal: number;
    despesasFixasPagas: number;
    despesasFixasPendentes: number;
    saldoLivre: number;
    limiteAjustado: number;
    rollover: number;
    gastoMercado: number;
    disponivelMercado: number;
    progressPct: number;
    expenses: FixedExpense[];
    goals: Goal[];
  };
}

export function DashboardView({ data }: DashboardViewProps) {
  return (
    <div className="p-3 sm:p-5 pb-6 space-y-6">
      {/* Page title */}
      <div className="pt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
          Visão Mensal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">Dashboard</h1>
      </div>

      {/* Grid Row 1: Summary & Thermometer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FinancialSummaryCard
          receitas={data.receitas}
          outrasDepesas={data.outrasDepesas}
          despesasFixasTotal={data.despesasFixasTotal}
          despesasFixasPagas={data.despesasFixasPagas}
          despesasFixasPendentes={data.despesasFixasPendentes}
          saldoLivre={data.saldoLivre}
        />

        <MarketThermometerCard
          limiteAjustado={data.limiteAjustado}
          rollover={data.rollover}
          gastoMercado={data.gastoMercado}
          disponivelMercado={data.disponivelMercado}
          progressPct={data.progressPct}
        />
      </div>

      {/* Grid Row 2: Bills & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <UpcomingBillsCard expenses={data.expenses} />
        <GoalsCard goals={data.goals} />
      </div>

      {/* Row 3: Close Month */}
      <div className="pt-2 max-w-xl mx-auto w-full">
        <CloseMonthButton monthYear={data.monthYear} />
      </div>
    </div>
  );
}
