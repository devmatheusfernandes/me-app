'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AllocateIncomeToGoalSchema,
  type AllocateIncomeToGoalInput,
} from '@/modules/finance/finance.schema';
import { allocateIncomeToGoalAction } from '@/modules/finance/finance.actions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { X, Target, Loader2, ArrowRightLeft } from 'lucide-react';
import type { Goal, Transaction } from '@/types';

interface AllocateIncomeModalProps {
  incomeItem: Transaction | null;
  goals: Goal[];
  selectedMonth: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AllocateIncomeModal({
  incomeItem,
  goals,
  selectedMonth,
  isOpen,
  onClose,
}: AllocateIncomeModalProps) {
  if (!isOpen) return null;

  return (
    <AllocateIncomeForm
      incomeItem={incomeItem}
      goals={goals}
      selectedMonth={selectedMonth}
      onClose={onClose}
    />
  );
}

function AllocateIncomeForm({
  incomeItem,
  goals,
  selectedMonth,
  onClose,
}: {
  incomeItem: Transaction | null;
  goals: Goal[];
  selectedMonth: string;
  onClose: () => void;
}) {
  const defaultGoalId = goals.length > 0 ? goals[0].id! : '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AllocateIncomeToGoalInput>({
    resolver: zodResolver(AllocateIncomeToGoalSchema),
    defaultValues: {
      goal_id: defaultGoalId,
      income_transaction_id: incomeItem?.id || null,
      income_name: incomeItem?.name || 'Receita',
      amount: Number(incomeItem?.amount || 100),
      reference_month: selectedMonth,
    },
  });

  const selectedGoalId = watch('goal_id');
  const targetGoal = goals.find((g) => g.id === selectedGoalId);

  const onSubmit = async (values: AllocateIncomeToGoalInput) => {
    try {
      const res = await allocateIncomeToGoalAction(values);
      if (res?.data?.success) {
        toast.success(
          `${formatCurrency(values.amount)} alocados para a meta "${res.data.goalName}"!`
        );
        onClose();
      } else {
        toast.error('Erro ao alocar receita para meta');
      }
    } catch {
      toast.error('Erro de conexão ao alocar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <ArrowRightLeft size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Alocar Receita para Meta</h3>
              <p className="text-xs text-slate-500">Guarde uma parte da sua receita em um objetivo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Origin income info card */}
        {incomeItem && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Receita de Origem
              </p>
              <p className="font-bold text-sm text-emerald-400">{incomeItem.name}</p>
            </div>
            <p className="font-bold text-base text-slate-100">
              {formatCurrency(incomeItem.amount)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Target Goal select */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Escolha a Meta de Destino
            </label>
            {goals.length === 0 ? (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                Você ainda não possui nenhuma meta criada. Crie uma meta na aba &quot;Metas&quot; primeiro.
              </p>
            ) : (
              <select
                {...register('goal_id')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)})
                  </option>
                ))}
              </select>
            )}
            {errors.goal_id && (
              <p className="text-xs text-rose-500 mt-1">{errors.goal_id.message}</p>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Valor a Guardar na Meta (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="200.00"
              {...register('amount', { valueAsNumber: true })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-purple-500 focus:outline-none"
            />
            {incomeItem && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setValue('amount', Number(incomeItem.amount))}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Tudo ({formatCurrency(incomeItem.amount)})
                </button>
                <button
                  type="button"
                  onClick={() => setValue('amount', Number(incomeItem.amount) / 2)}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Metade ({formatCurrency(incomeItem.amount / 2)})
                </button>
              </div>
            )}
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          {targetGoal && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-center gap-2">
              <Target size={15} className="shrink-0 text-purple-400" />
              <span>
                Novo saldo previsto da meta &quot;{targetGoal.name}&quot;:{' '}
                <strong>
                  {formatCurrency(
                    Number(targetGoal.current_amount || 0) + (watch('amount') || 0)
                  )}
                </strong>
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || goals.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Target size={18} /> Confirmar e Guardar na Meta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
