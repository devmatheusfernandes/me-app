'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AddExpenseSchema,
  AddIncomeSchema,
  AddGoalSchema,
  type AddExpenseInput,
  type AddIncomeInput,
  type AddGoalInput,
} from '@/modules/finance/finance.schema';
import {
  editFixedExpenseAction,
  editIncomeAction,
  editGoalAction,
  deleteExpenseAction,
  deleteTransactionAction,
  deleteGoalAction,
} from '@/modules/finance/finance.actions';
import { toast } from 'sonner';
import { X, Loader2, Trash2, Save } from 'lucide-react';
import type { FixedExpense, Transaction, Goal } from '@/types';

type EditItem =
  | { type: 'expense'; data: FixedExpense }
  | { type: 'income'; data: Transaction }
  | { type: 'goal'; data: Goal };

interface EditFinancialModalProps {
  item: EditItem | null;
  selectedMonth: string;
  onClose: () => void;
}

export function EditFinancialModal({
  item,
  selectedMonth,
  onClose,
}: EditFinancialModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-100">
            {item.type === 'expense' &&
              (item.data.type === 'subscription' ? 'Editar Assinatura' : 'Editar Despesa')}
            {item.type === 'income' && 'Editar Receita'}
            {item.type === 'goal' && 'Editar Objetivo'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={20} />
          </button>
        </div>

        {item.type === 'expense' && (
          <EditExpenseForm
            key={item.data.id}
            expense={item.data}
            selectedMonth={selectedMonth}
            onClose={onClose}
          />
        )}

        {item.type === 'income' && (
          <EditIncomeForm
            key={item.data.id}
            transaction={item.data}
            selectedMonth={selectedMonth}
            onClose={onClose}
          />
        )}

        {item.type === 'goal' && (
          <EditGoalForm key={item.data.id} goal={item.data} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

/* Edit Expense Form */
function EditExpenseForm({
  expense,
  selectedMonth,
  onClose,
}: {
  expense: FixedExpense;
  selectedMonth: string;
  onClose: () => void;
}) {
  const isSubscription = expense.type === 'subscription';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseInput>({
    resolver: zodResolver(AddExpenseSchema),
    defaultValues: {
      name: expense.name,
      type: expense.type,
      expected_amount: Number(expense.expected_amount || 0),
      is_variable: Boolean(expense.is_variable),
      is_recurring: Boolean(expense.is_recurring),
      billing_cycle: expense.billing_cycle || 'monthly',
      is_auto_paid: Boolean(expense.is_auto_paid),
      due_day: Number(expense.due_day || 10),
      reference_month: expense.reference_month || selectedMonth,
    },
  });

  const onSubmit = async (values: AddExpenseInput) => {
    onClose();
    try {
      const res = await editFixedExpenseAction({
        id: expense.id!,
        ...values,
      });
      if (res?.data?.success) {
        toast.success('Atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja excluir este item permanentemente?')) return;
    onClose();
    try {
      await deleteExpenseAction({ id: expense.id! });
      toast.success('Item excluído!');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nome
        </label>
        <input
          type="text"
          {...register('name')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('expected_amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.expected_amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.expected_amount.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dia do Vencimento
          </label>
          <input
            type="number"
            min="1"
            max="31"
            {...register('due_day', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.due_day && (
            <p className="text-xs text-rose-500 mt-1">{errors.due_day.message}</p>
          )}
        </div>
      </div>

      {!isSubscription && (
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_recurring')}
              className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
            />
            <span className="text-xs text-slate-300">Mensal Fixa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_variable')}
              className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
            />
            <span className="text-xs text-slate-300">Valor Variável</span>
          </label>
        </div>
      )}

      {isSubscription && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Ciclo de Cobrança
          </label>
          <select
            {...register('billing_cycle')}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleDelete}
          className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Trash2 size={16} /> Excluir
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>
    </form>
  );
}

/* Edit Income Form */
function EditIncomeForm({
  transaction,
  selectedMonth,
  onClose,
}: {
  transaction: Transaction;
  selectedMonth: string;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddIncomeInput>({
    resolver: zodResolver(AddIncomeSchema),
    defaultValues: {
      name: transaction.name,
      amount: Number(transaction.amount || 0),
      date: Number(transaction.date || 1),
      reference_month: transaction.reference_month || selectedMonth,
      is_fixed: Boolean(transaction.is_fixed),
    },
  });

  const onSubmit = async (values: AddIncomeInput) => {
    onClose();
    try {
      const res = await editIncomeAction({
        id: transaction.id!,
        ...values,
      });
      if (res?.data?.success) {
        toast.success('Receita atualizada com sucesso!');
      } else {
        toast.error('Erro ao atualizar receita');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja excluir esta receita?')) return;
    onClose();
    try {
      await deleteTransactionAction({ id: transaction.id! });
      toast.success('Receita excluída!');
    } catch {
      toast.error('Erro ao excluir receita');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nome da Receita
        </label>
        <input
          type="text"
          {...register('name')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dia da Entrada
          </label>
          <input
            type="number"
            min="1"
            max="31"
            {...register('date', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.date && (
            <p className="text-xs text-rose-500 mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('is_fixed')}
            className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
          />
          <span className="text-xs text-slate-300">Receita Recorrente / Fixa</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleDelete}
          className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Trash2 size={16} /> Excluir
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>
    </form>
  );
}

/* Edit Goal Form */
function EditGoalForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddGoalInput>({
    resolver: zodResolver(AddGoalSchema),
    defaultValues: {
      name: goal.name,
      target_amount: Number(goal.target_amount || 0),
      current_amount: Number(goal.current_amount || 0),
      color: goal.color || 'emerald',
    },
  });

  const onSubmit = async (values: AddGoalInput) => {
    onClose();
    try {
      const res = await editGoalAction({
        id: goal.id!,
        ...values,
      });
      if (res?.data?.success) {
        toast.success('Objetivo atualizado!');
      } else {
        toast.error('Erro ao atualizar objetivo');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja excluir este objetivo?')) return;
    onClose();
    try {
      await deleteGoalAction({ id: goal.id! });
      toast.success('Objetivo excluído!');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nome do Objetivo
        </label>
        <input
          type="text"
          {...register('name')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Valor Meta (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('target_amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.target_amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.target_amount.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Valor Atual (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('current_amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Cor do Cartão
        </label>
        <select
          {...register('color')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="emerald">Verde (Emergência)</option>
          <option value="blue">Azul (Bens / Carro)</option>
          <option value="amber">Amarelo (Viagem / Geral)</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleDelete}
          className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Trash2 size={16} /> Excluir
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>
    </form>
  );
}
