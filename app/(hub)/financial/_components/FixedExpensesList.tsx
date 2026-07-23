'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Pencil } from 'lucide-react';
import { toggleExpensePaidAction, deleteExpenseAction } from '@/modules/finance/finance.actions';
import { formatCurrency, formatMonthYearLabel } from '@/lib/utils';
import { toast } from 'sonner';
import type { FixedExpense } from '@/types';

interface FixedExpensesListProps {
  expenses: FixedExpense[];
  selectedMonth: string;
  onOpenAddModal: () => void;
  onEdit?: (expense: FixedExpense) => void;
}

export function FixedExpensesList({
  expenses,
  selectedMonth,
  onOpenAddModal,
  onEdit,
}: FixedExpensesListProps) {
  // Local state for optimistic paid toggles
  const [optimisticPaid, setOptimisticPaid] = useState<Record<string, boolean>>({});

  // Filter only regular expenses (type !== 'subscription')
  const regularExpenses = expenses.filter((e) => e.type !== 'subscription');

  const togglePaid = async (expense: FixedExpense) => {
    const currentPaid = optimisticPaid[expense.id!] ?? expense.is_paid;
    const newPaidStatus = !currentPaid;

    setOptimisticPaid((prev) => ({ ...prev, [expense.id!]: newPaidStatus }));

    try {
      const res = await toggleExpensePaidAction({
        id: expense.id!,
        is_paid: newPaidStatus,
        paid_amount: expense.expected_amount,
      });

      if (res?.data?.success) {
        toast.success(newPaidStatus ? 'Conta marcada como paga!' : 'Conta desmarcada.');
      } else {
        toast.error('Erro ao atualizar conta');
        setOptimisticPaid((prev) => ({ ...prev, [expense.id!]: currentPaid }));
      }
    } catch {
      toast.error('Erro de conexão ao atualizar conta');
      setOptimisticPaid((prev) => ({ ...prev, [expense.id!]: currentPaid }));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a despesa "${name}"?`)) return;
    try {
      await deleteExpenseAction({ id });
      toast.success('Despesa removida');
    } catch {
      toast.error('Erro ao remover despesa');
    }
  };

  const totalPago = regularExpenses
    .filter((e) => optimisticPaid[e.id!] ?? e.is_paid)
    .reduce((s, e) => s + (e.paid_amount ?? e.expected_amount), 0);

  const totalPendente = regularExpenses
    .filter((e) => !(optimisticPaid[e.id!] ?? e.is_paid))
    .reduce((s, e) => s + e.expected_amount, 0);

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Contas de {formatMonthYearLabel(selectedMonth)}
        </h2>
        <button
          onClick={onOpenAddModal}
          className="text-slate-400 hover:text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800 active:scale-95 transition-all"
        >
          <Plus size={15} />
        </button>
      </div>

      {regularExpenses.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-xs text-slate-500">
          Nenhuma despesa fixa cadastrada para este mês.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {regularExpenses.map((item) => {
            const isPaid = optimisticPaid[item.id!] ?? item.is_paid;

            return (
              <div
                key={item.id}
                className={`w-full flex items-center gap-3 rounded-2xl p-4 border transition-all ${
                  isPaid
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
                style={{ minHeight: '68px' }}
              >
                {/* Checkbox button */}
                <button
                  onClick={() => togglePaid(item)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isPaid ? 'text-emerald-500' : 'text-slate-600'
                  }`}
                >
                  {isPaid ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </button>

                <div className="flex-1 min-w-0" onClick={() => togglePaid(item)}>
                  <p
                    className={`font-semibold text-sm leading-tight truncate ${
                      isPaid ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-xs text-slate-500">Vence dia {item.due_day}</p>
                    {item.is_recurring ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full">
                        Fixa
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">
                        Pontual
                      </span>
                    )}
                    {item.is_variable && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full">
                        Variável
                      </span>
                    )}
                    {isPaid && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">
                        Pago
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p
                    className={`font-bold text-sm shrink-0 ${
                      isPaid ? 'text-slate-600' : 'text-slate-200'
                    }`}
                  >
                    {formatCurrency(item.expected_amount)}
                  </p>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit?.(item)}
                    className="text-slate-500 hover:text-blue-400 p-1 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id!, item.name)}
                    className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary box */}
      <div className="mt-5 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="flex justify-between items-center p-4 bg-slate-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <p className="text-xs font-semibold text-slate-400">Pago</p>
          </div>
          <p className="font-bold text-sm text-emerald-400">{formatCurrency(totalPago)}</p>
        </div>
        <div className="flex justify-between items-center p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Circle size={14} className="text-amber-400" />
            <p className="text-xs font-semibold text-slate-400">Pendente</p>
          </div>
          <p className="font-bold text-sm text-amber-400">{formatCurrency(totalPendente)}</p>
        </div>
      </div>
    </div>
  );
}
