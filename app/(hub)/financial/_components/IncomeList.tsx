'use client';

import { ArrowUpRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteTransactionAction } from '@/modules/finance/finance.actions';
import { formatCurrency, formatMonthYearLabel } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

interface IncomeListProps {
  transactions: Transaction[];
  selectedMonth: string;
  onOpenAddModal: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export function IncomeList({
  transactions,
  selectedMonth,
  onOpenAddModal,
  onEdit,
}: IncomeListProps) {
  const incomes = transactions.filter((t) => t.type === 'income');

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a receita "${name}"?`)) return;
    try {
      await deleteTransactionAction({ id });
      toast.success('Receita removida!');
    } catch {
      toast.error('Erro ao remover receita');
    }
  };

  return (
    <div className="animate-in fade-in duration-200">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
        Entradas de {formatMonthYearLabel(selectedMonth)}
      </h2>

      {incomes.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-xs text-slate-500 mb-5">
          Nenhuma receita cadastrada neste mês.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {incomes.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-200 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">dia {item.date}</p>
                  {item.is_fixed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                      Fixo
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-emerald-400 shrink-0">
                  {formatCurrency(item.amount)}
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
        className="w-full bg-emerald-600 text-white font-semibold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all hover:bg-emerald-500"
      >
        <Plus size={17} /> Adicionar Receita
      </button>
    </div>
  );
}
