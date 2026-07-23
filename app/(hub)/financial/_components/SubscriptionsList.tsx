'use client';

import { CreditCard, Repeat, Plus, Trash2, Pencil } from 'lucide-react';
import { deleteExpenseAction } from '@/modules/finance/finance.actions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { FixedExpense } from '@/types';

interface SubscriptionsListProps {
  expenses: FixedExpense[];
  onOpenAddModal: () => void;
  onEdit?: (expense: FixedExpense) => void;
}

export function SubscriptionsList({ expenses, onOpenAddModal, onEdit }: SubscriptionsListProps) {
  const subscriptions = expenses.filter((e) => e.type === 'subscription');

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a assinatura "${name}"?`)) return;
    try {
      await deleteExpenseAction({ id });
      toast.success('Assinatura removida');
    } catch {
      toast.error('Erro ao remover assinatura');
    }
  };

  const totalMensal = subscriptions.reduce((s, e) => s + e.expected_amount, 0);

  return (
    <div className="animate-in fade-in duration-200">
      {/* Total Card */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col items-center text-center mb-5">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
          <CreditCard size={22} className="text-blue-400" />
        </div>
        <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
          Total Mensal em Assinaturas
        </p>
        <h2 className="text-3xl font-bold text-slate-50">{formatCurrency(totalMensal)}</h2>
        <p className="text-[10px] text-slate-500 mt-1">Cobradas no cartão de crédito</p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-xs text-slate-500">
          Nenhuma assinatura cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subscriptions.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Repeat size={15} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    Vence dia {item.due_day} • {item.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-200">
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
          ))}
        </div>
      )}

      <button
        onClick={onOpenAddModal}
        className="w-full mt-5 bg-slate-900 text-blue-400 font-semibold rounded-xl py-4 border border-slate-800 border-dashed flex items-center justify-center gap-2 transition-colors hover:bg-slate-800/80 active:scale-[0.98]"
      >
        <Plus size={17} /> Nova Assinatura
      </button>
    </div>
  );
}
