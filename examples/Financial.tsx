import React, { useState } from 'react';
import { AppLayout, useMonth } from './AppLayout';
import {
  CheckCircle2, Circle, Plus, Repeat, CreditCard,
  ArrowUpRight, Target, ChevronRight, Pencil
} from 'lucide-react';

type Tab = 'fixas' | 'assinaturas' | 'receitas' | 'metas';

interface FixedExpense {
  name: string; amount: string; date: string; paid: boolean;
}

interface Goal {
  id: string; name: string; current: number; target: number; color: 'emerald' | 'blue' | 'amber';
}

function FinancialContent() {
  const { label } = useMonth();
  const [activeTab, setActiveTab] = useState<Tab>('fixas');
  const [expenses, setExpenses] = useState<FixedExpense[]>([
    { name: 'Aluguel',      amount: '1.500,00', date: '05', paid: true  },
    { name: 'Luz',          amount: '180,00',   date: '10', paid: false },
    { name: 'Internet',     amount: '120,00',   date: '15', paid: true  },
    { name: 'Academia',     amount: '99,00',    date: '20', paid: false },
    { name: 'Plano Celular',amount: '79,90',    date: '25', paid: false },
  ]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'g1', name: 'Reserva de Emergência', current: 4500, target: 10000, color: 'emerald' },
    { id: 'g2', name: 'Troca de Carro',        current: 5750, target: 25000, color: 'blue'    },
    { id: 'g3', name: 'Viagem Europa',         current: 1200, target: 8000,  color: 'amber'   },
  ]);
  const [aportInput, setAportInput] = useState<Record<string, string>>({});

  const togglePaid = (i: number) =>
    setExpenses(prev => prev.map((e, idx) => idx === i ? { ...e, paid: !e.paid } : e));

  const totalPago = expenses
    .filter(e => e.paid)
    .reduce((s, e) => s + parseFloat(e.amount.replace('.', '').replace(',', '.')), 0);
  const totalPendente = expenses
    .filter(e => !e.paid)
    .reduce((s, e) => s + parseFloat(e.amount.replace('.', '').replace(',', '.')), 0);

  const colorMap = { emerald: 'emerald', blue: 'blue', amber: 'amber' };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fixas',       label: 'Despesas' },
    { id: 'assinaturas', label: 'Assinaturas' },
    { id: 'receitas',    label: 'Receitas' },
    { id: 'metas',       label: 'Metas' },
  ];

  return (
    <div className="p-5 pb-6">
      <div className="pt-2 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Módulo</p>
        <h1 className="text-2xl font-bold text-slate-50">Financeiro</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6 gap-0.5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-slate-800 text-slate-50 shadow-md border border-slate-700/50'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DESPESAS FIXAS ── */}
      {activeTab === 'fixas' && (
        <div className="animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contas de {label}</h2>
            <button className="text-slate-400 hover:text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
              <Plus size={15} />
            </button>
          </div>

          <div className="space-y-2.5">
            {expenses.map((item, i) => (
              <button
                key={i}
                onClick={() => togglePaid(i)}
                className={`w-full flex items-center gap-4 rounded-2xl p-4 border transition-all active:scale-[0.98] text-left ${
                  item.paid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'
                }`}
                style={{ minHeight: '68px' }}
              >
                {/* Large checkbox */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  item.paid ? 'text-emerald-500' : 'text-slate-600'
                }`}>
                  {item.paid ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </div>

                <div className="flex-1">
                  <p className={`font-semibold text-sm leading-tight ${item.paid ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500">Vence dia {item.date}</p>
                    {item.paid && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">
                        Pago
                      </span>
                    )}
                  </div>
                </div>

                <p className={`font-bold text-sm shrink-0 ${item.paid ? 'text-slate-600' : 'text-slate-200'}`}>
                  R$ {item.amount}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-slate-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className="text-xs font-semibold text-slate-400">Pago</p>
              </div>
              <p className="font-bold text-sm text-emerald-400">R$ {totalPago.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Circle size={14} className="text-amber-400" />
                <p className="text-xs font-semibold text-slate-400">Pendente</p>
              </div>
              <p className="font-bold text-sm text-amber-400">R$ {totalPendente.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSINATURAS ── */}
      {activeTab === 'assinaturas' && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
              <CreditCard size={22} className="text-blue-400" />
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Mensal</p>
            <h2 className="text-3xl font-bold text-slate-50">R$ 99<span className="text-lg text-slate-500">,70</span></h2>
          </div>
          <div className="space-y-2.5">
            {[
              { name: 'Netflix',      amount: '45,90', type: 'Entretenimento' },
              { name: 'Spotify',      amount: '21,90', type: 'Música' },
              { name: 'Amazon Prime', amount: '19,90', type: 'Streaming & Frete' },
              { name: 'Google One',   amount: '12,00', type: 'Armazenamento' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <Repeat size={15} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.type}</p>
                  </div>
                </div>
                <p className="font-bold text-sm text-slate-200">R$ {item.amount}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 bg-slate-900 text-blue-400 font-semibold rounded-xl py-4 border border-slate-800 border-dashed flex items-center justify-center gap-2 transition-colors">
            <Plus size={17} /> Nova Assinatura
          </button>
        </div>
      )}

      {/* ── RECEITAS ── */}
      {activeTab === 'receitas' && (
        <div className="animate-in fade-in duration-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Entradas de {label}</h2>
          <div className="space-y-2.5 mb-5">
            {[
              { name: 'Salário',       amount: '4.800,00', date: '05', fixed: true  },
              { name: 'Freela Design', amount: '800,00',   date: '12', fixed: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-200">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500">dia {item.date}</p>
                    {item.fixed && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">Fixo</span>}
                  </div>
                </div>
                <p className="font-bold text-sm text-emerald-400">R$ {item.amount}</p>
              </div>
            ))}
          </div>
          <button className="w-full bg-emerald-600 text-white font-semibold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">
            <Plus size={17} /> Adicionar Receita
          </button>
        </div>
      )}

      {/* ── METAS ── */}
      {activeTab === 'metas' && (
        <div className="animate-in fade-in duration-200 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Objetivos de Longo Prazo</h2>
            <button className="text-slate-400 hover:text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
              <Plus size={15} />
            </button>
          </div>

          {goals.map(goal => {
            const pct = Math.round((goal.current / goal.target) * 100);
            const c = goal.color;
            const colorClasses = {
              emerald: { bar: 'bg-emerald-500', badge: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', btn: 'bg-emerald-600 shadow-emerald-500/20' },
              blue:    { bar: 'bg-blue-500',    badge: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    btn: 'bg-blue-600 shadow-blue-500/20'    },
              amber:   { bar: 'bg-amber-500',   badge: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   btn: 'bg-amber-600 shadow-amber-500/20'  },
            }[c];

            const [showAport, setShowAport] = useState(false);

            return (
              <div key={goal.id} className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
                      <Target size={15} className={colorClasses.badge} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">{goal.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        R$ {goal.current.toLocaleString('pt-BR')} / R$ {goal.target.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${colorClasses.badge}`}>{pct}%</span>
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full ${colorClasses.bar} transition-all`} style={{ width: `${pct}%` }} />
                </div>

                {/* Quick contribution */}
                {showAport ? (
                  <div className="flex gap-2 animate-in fade-in duration-150">
                    <input
                      type="number"
                      placeholder="R$ valor do aporte"
                      value={aportInput[goal.id] ?? ''}
                      onChange={e => setAportInput(a => ({ ...a, [goal.id]: e.target.value }))}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(aportInput[goal.id] ?? '0');
                        if (val > 0) setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, current: g.current + val } : g));
                        setAportInput(a => ({ ...a, [goal.id]: '' }));
                        setShowAport(false);
                      }}
                      className={`px-4 rounded-xl text-white font-bold text-sm shadow-lg ${colorClasses.btn} active:scale-95 transition-all`}
                    >
                      OK
                    </button>
                    <button onClick={() => setShowAport(false)} className="text-slate-500 text-sm px-2">Cancelar</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAport(true)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${colorClasses.bg} ${colorClasses.border} ${colorClasses.badge}`}
                  >
                    <Plus size={14} /> Adicionar Aporte do Mês
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Financial() {
  return (
    <AppLayout activeTab="financial">
      <FinancialContent />
    </AppLayout>
  );
}
