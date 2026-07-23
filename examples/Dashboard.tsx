import React, { useState } from 'react';
import { AppLayout, useMonth } from './AppLayout';
import {
  ArrowUpRight, ArrowDownRight, ShoppingBag, Target,
  CheckCircle2, Circle, Lock, TrendingUp, TrendingDown, CalendarCheck
} from 'lucide-react';

function DashboardContent() {
  const { label } = useMonth();

  const [closedMonth, setClosedMonth] = useState(false);

  // Financial summary data
  const receitas = 5600.00;
  const despesasFixasTotal = 1978.90;
  const despesasFixasPagas = 1620.00; // Aluguel + Internet
  const despesasFixasPendentes = despesasFixasTotal - despesasFixasPagas;
  const saldoLivre = receitas - despesasFixasTotal;

  // Market thermometer with rollover
  const limiteBase = 2000;
  const rollover = +200; // saved from last month
  const limiteAjustado = limiteBase + rollover;
  const gastoMercado = 847.50;
  const disponivelMercado = limiteAjustado - gastoMercado;
  const progressPct = Math.min((gastoMercado / limiteAjustado) * 100, 100);

  return (
    <div className="p-5 pb-6 space-y-5">

      {/* Page title */}
      <div className="pt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Visão Mensal</p>
        <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 relative z-10">Resumo Financeiro</p>

        {/* Receitas */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Receitas Totais</p>
              <p className="text-base font-bold text-emerald-400">
                R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Despesas Fixas</p>
              <p className="text-base font-bold text-rose-400">
                R$ {despesasFixasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="text-right mt-0.5">
            <div className="flex items-center gap-1 justify-end mb-0.5">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-500">
                R$ {despesasFixasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Circle size={11} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-400">
                R$ {despesasFixasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-800 mb-4" />

        {/* Saldo Livre */}
        <div className="flex items-center justify-between relative z-10">
          <p className="text-sm font-semibold text-slate-400">Saldo Livre</p>
          <p className="text-2xl font-bold text-white tracking-tight">
            R$ {saldoLivre.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Market Thermometer with Rollover */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-blue-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Termômetro do Mercado</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Limite Ajustado</p>
            <p className="text-base font-bold text-slate-100">
              R$ {limiteAjustado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Rollover explanation */}
        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs font-medium ${rollover >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
          {rollover >= 0
            ? <TrendingUp size={13} className="shrink-0" />
            : <TrendingDown size={13} className="shrink-0" />}
          <span>
            {rollover >= 0
              ? `Sobrou R$ ${Math.abs(rollover).toFixed(2).replace('.', ',')} no mês anterior → limite aumentou`
              : `Estourou R$ ${Math.abs(rollover).toFixed(2).replace('.', ',')} no mês anterior → limite reduziu`}
          </span>
        </div>

        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden mb-3 shadow-inner">
          <div
            className={`h-full rounded-full transition-all ${progressPct > 80 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <p className="text-slate-400">Gasto: <span className="text-slate-200 font-semibold">R$ {gastoMercado.toFixed(2).replace('.', ',')}</span></p>
          <p className="text-slate-400">Disponível: <span className="text-emerald-400 font-semibold">R$ {disponivelMercado.toFixed(2).replace('.', ',')}</span></p>
        </div>
      </div>

      {/* Próximos Vencimentos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-200">Próximos Vencimentos</h3>
          <button className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Ver todos</button>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Luz', amount: '180,00', days: 3, alert: true },
            { name: 'Internet', amount: '120,00', days: 7, alert: false },
            { name: 'Netflix', amount: '45,90', days: 12, alert: false },
          ].map((bill, i) => (
            <div key={i} className="flex justify-between items-center bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-10 rounded-full ${bill.alert ? 'bg-rose-500' : 'bg-slate-700'}`} />
                <div>
                  <p className="font-semibold text-slate-200 text-sm">{bill.name}</p>
                  <p className={`text-xs font-medium ${bill.alert ? 'text-rose-400' : 'text-slate-500'}`}>
                    vence em {bill.days} dias
                  </p>
                </div>
              </div>
              <p className="font-bold text-slate-200 text-sm">R$ {bill.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <h3 className="text-base font-bold text-slate-200 mb-3">Objetivos</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Reserva de Emergência', pct: 45, current: '4.500', target: '10.000', color: 'emerald' },
            { name: 'Troca de Carro', pct: 23, current: '5.750', target: '25.000', color: 'blue' },
          ].map((goal, i) => (
            <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${goal.color === 'emerald' ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                <Target size={15} className={goal.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'} />
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1 leading-tight">{goal.name}</p>
              <p className="text-[10px] text-slate-500 mb-2">R$ {goal.current} / R$ {goal.target}</p>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${goal.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${goal.pct}%` }}
                />
              </div>
              <p className={`text-[10px] font-bold ${goal.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>{goal.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fechar o Mês */}
      <button
        onClick={() => setClosedMonth(v => !v)}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
          closedMonth
            ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 shadow-emerald-500/10'
            : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 shadow-black/20'
        }`}
      >
        {closedMonth
          ? <><CheckCircle2 size={18} className="text-emerald-400" /> Mês Fechado — Rollover calculado</>
          : <><CalendarCheck size={18} /> Fechar o Mês</>}
      </button>

      {closedMonth && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400 animate-in fade-in duration-300">
          <p className="font-semibold mb-1">Rollover calculado!</p>
          <p className="text-emerald-400/70 text-xs">Sobrou <strong className="text-emerald-400">R$ 200,00</strong> no mercado. O limite de {label.split(' ')[0] === 'Julho' ? 'Agosto' : 'próximo mês'} será de <strong className="text-emerald-400">R$ 2.200,00</strong>.</p>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  return (
    <AppLayout activeTab="dashboard">
      <DashboardContent />
    </AppLayout>
  );
}
