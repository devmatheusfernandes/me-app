'use client';

import { useState } from 'react';
import { Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { addGoalContributionAction, deleteGoalAction } from '@/modules/finance/finance.actions';
import { toast } from 'sonner';
import type { Goal } from '@/types';

interface GoalsListProps {
  goals: Goal[];
  onOpenAddModal: () => void;
  onEdit?: (goal: Goal) => void;
}

export function GoalsList({ goals, onOpenAddModal, onEdit }: GoalsListProps) {
  const [showAport, setShowAport] = useState<Record<string, boolean>>({});
  const [aportInput, setAportInput] = useState<Record<string, string>>({});

  const handleContribution = async (goalId: string) => {
    const val = parseFloat(aportInput[goalId] ?? '0');
    if (val <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setAportInput((a) => ({ ...a, [goalId]: '' }));
    setShowAport((s) => ({ ...s, [goalId]: false }));

    try {
      const res = await addGoalContributionAction({ goal_id: goalId, amount: val });
      if (res?.data?.success) {
        toast.success(`Aporte de ${formatCurrency(val)} registrado!`);
      } else {
        toast.error('Erro ao salvar aporte');
      }
    } catch {
      toast.error('Erro ao conectar com servidor');
    }
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir o objetivo "${name}"?`)) return;
    try {
      await deleteGoalAction({ id });
      toast.success('Objetivo removido!');
    } catch {
      toast.error('Erro ao remover objetivo');
    }
  };

  return (
    <div className="animate-in fade-in duration-200 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Objetivos de Longo Prazo
        </h2>
        <button
          onClick={onOpenAddModal}
          className="text-slate-400 hover:text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800 active:scale-95 transition-all"
        >
          <Plus size={15} />
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-xs text-slate-500">
          Nenhuma meta cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.current_amount / (goal.target_amount || 1)) * 100)
            );
            const isEmerald = goal.color === 'emerald' || goal.name.toLowerCase().includes('emerg');
            const isBlue = goal.color === 'blue' || goal.name.toLowerCase().includes('carro');

            const colorClasses = isEmerald
              ? {
                  bar: 'bg-emerald-500',
                  badge: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/20',
                  btn: 'bg-emerald-600 shadow-emerald-500/20',
                }
              : isBlue
              ? {
                  bar: 'bg-blue-500',
                  badge: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  border: 'border-blue-500/20',
                  btn: 'bg-blue-600 shadow-blue-500/20',
                }
              : {
                  bar: 'bg-amber-500',
                  badge: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/20',
                  btn: 'bg-amber-600 shadow-amber-500/20',
                };

            const isAportOpen = showAport[goal.id!];

            return (
              <div
                key={goal.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${colorClasses.bg} flex items-center justify-center shrink-0`}
                    >
                      <Target size={15} className={colorClasses.badge} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">{goal.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${colorClasses.badge}`}>{pct}%</span>

                    {/* Edit button */}
                    <button
                      onClick={() => onEdit?.(goal)}
                      className="text-slate-500 hover:text-blue-400 p-1 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteGoal(goal.id!, goal.name)}
                      className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${colorClasses.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Quick contribution form */}
                {isAportOpen ? (
                  <div className="flex gap-2 animate-in fade-in duration-150">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="R$ valor do aporte"
                      value={aportInput[goal.id!] ?? ''}
                      onChange={(e) =>
                        setAportInput((a) => ({ ...a, [goal.id!]: e.target.value }))
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleContribution(goal.id!)}
                      className={`px-4 rounded-xl text-white font-bold text-sm shadow-lg ${colorClasses.btn} active:scale-95 transition-all`}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowAport((s) => ({ ...s, [goal.id!]: false }))}
                      className="text-slate-500 text-sm px-2"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAport((s) => ({ ...s, [goal.id!]: true }))}
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
