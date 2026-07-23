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
  addFixedExpenseAction,
  addIncomeAction,
  addGoalAction,
} from '@/modules/finance/finance.actions';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import type { Tab } from './FinancialTabs';

interface AddExpenseSheetProps {
  activeTab: Tab;
  selectedMonth: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseSheet({
  activeTab,
  selectedMonth,
  isOpen,
  onClose,
}: AddExpenseSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[390px] md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-100">
            {activeTab === 'fixas' && 'Nova Despesa'}
            {activeTab === 'assinaturas' && 'Nova Assinatura'}
            {activeTab === 'receitas' && 'Nova Receita'}
            {activeTab === 'metas' && 'Novo Objetivo'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X size={20} />
          </button>
        </div>

        {activeTab === 'fixas' && (
          <ExpenseForm selectedMonth={selectedMonth} type="expense" onClose={onClose} />
        )}
        {activeTab === 'assinaturas' && (
          <ExpenseForm selectedMonth={selectedMonth} type="subscription" onClose={onClose} />
        )}
        {activeTab === 'receitas' && (
          <IncomeForm selectedMonth={selectedMonth} onClose={onClose} />
        )}
        {activeTab === 'metas' && <GoalForm onClose={onClose} />}
      </div>
    </div>
  );
}

function ExpenseForm({
  selectedMonth,
  type,
  onClose,
}: {
  selectedMonth: string;
  type: 'expense' | 'subscription';
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseInput>({
    resolver: zodResolver(AddExpenseSchema),
    defaultValues: {
      type,
      due_day: 10,
      is_variable: false,
      is_recurring: true,
      is_auto_paid: type === 'subscription',
      billing_cycle: 'monthly',
      reference_month: selectedMonth,
    },
  });

  const onSubmit = async (data: AddExpenseInput) => {
    // Optimistic UI close & notification
    onClose();
    toast.success(type === 'subscription' ? 'Assinatura adicionada!' : 'Despesa adicionada!');

    try {
      const res = await addFixedExpenseAction(data);
      if (!res?.data?.success) {
        toast.error('Erro ao salvar no servidor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nome da Conta / Lançamento
        </label>
        <input
          type="text"
          placeholder={type === 'subscription' ? 'ex: Netflix, Spotify' : 'ex: Conta de Luz, Aluguel, Farmácia'}
          {...register('name')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Valor Previsto (R$)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
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
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Mês de Referência (YYYY-MM)
        </label>
        <input
          type="month"
          {...register('reference_month')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {type === 'expense' && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_recurring')}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
            />
            <span className="text-xs text-slate-300 font-medium">
              Despesa Recorrente / Fixa (repete todo mês)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_variable')}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
            />
            <span className="text-xs text-slate-400">Valor varia todo mês (ex: Água/Luz)</span>
          </label>
        </div>
      )}

      {type === 'subscription' && (
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-sm mt-4 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Despesa'}
      </button>
    </form>
  );
}

function IncomeForm({
  selectedMonth,
  onClose,
}: {
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
      date: 5,
      is_fixed: true,
      reference_month: selectedMonth,
    },
  });

  const onSubmit = async (data: AddIncomeInput) => {
    onClose();
    toast.success('Receita adicionada!');

    try {
      const res = await addIncomeAction(data);
      if (!res?.data?.success) {
        toast.error('Erro ao salvar receita no servidor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Descrição / Origem
        </label>
        <input
          type="text"
          placeholder="ex: Salário, Freela Design"
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
            placeholder="0.00"
            {...register('amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>}
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
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Mês de Referência (YYYY-MM)
        </label>
        <input
          type="month"
          {...register('reference_month')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3.5 font-bold text-sm mt-4 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Adicionar Receita'}
      </button>
    </form>
  );
}

function GoalForm({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddGoalInput>({
    resolver: zodResolver(AddGoalSchema),
    defaultValues: {
      current_amount: 0,
      color: 'emerald',
    },
  });

  const onSubmit = async (data: AddGoalInput) => {
    onClose();
    toast.success('Objetivo criado!');

    try {
      const res = await addGoalAction(data);
      if (!res?.data?.success) {
        toast.error('Erro ao criar objetivo no servidor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar');
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
          placeholder="ex: Reserva de Emergência, Troca de Carro"
          {...register('name')}
          className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Meta Total (R$)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="10000"
            {...register('target_amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          {errors.target_amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.target_amount.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo Atual (R$)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0"
            {...register('current_amount', { valueAsNumber: true })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-sm mt-4 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Criar Objetivo'}
      </button>
    </form>
  );
}
