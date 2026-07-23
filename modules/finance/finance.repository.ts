import { createClient } from '@/lib/supabase/server';
import type { MonthlySummary, FixedExpense, Goal, Transaction } from '@/types';

export const financeRepository = {
  async getMonthlySummary(userId: string, monthYear: string): Promise<MonthlySummary | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar resumo mensal: ${error.message}`);
    return data;
  },

  async createMonthlySummary(data: Partial<MonthlySummary>): Promise<MonthlySummary> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('monthly_summaries')
      .upsert([data], { onConflict: 'user_id,month_year' })
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar resumo mensal: ${error.message}`);
    return created;
  },

  async getFixedExpenses(userId: string, monthYear: string): Promise<FixedExpense[]> {
    const supabase = await createClient();

    // 1. Fetch expenses for this target month
    const { data: monthExpenses, error: err1 } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_month', monthYear)
      .order('due_day', { ascending: true });

    if (err1) throw new Error(`Erro ao buscar despesas fixas: ${err1.message}`);

    // 2. Fetch all recurring expenses for this user
    const { data: recurringExpenses } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true);

    if (!recurringExpenses || recurringExpenses.length === 0) {
      return monthExpenses || [];
    }

    // 3. Find recurring template expenses not yet present in this month
    const existingKeys = new Set((monthExpenses || []).map((e) => `${e.name.trim().toLowerCase()}_${e.type}`));
    const missingToCopy: Partial<FixedExpense>[] = [];
    const seenTemplates = new Set<string>();

    for (const rec of recurringExpenses) {
      const key = `${rec.name.trim().toLowerCase()}_${rec.type}`;
      if (!existingKeys.has(key) && !seenTemplates.has(key)) {
        seenTemplates.add(key);
        missingToCopy.push({
          user_id: userId,
          name: rec.name,
          type: rec.type,
          expected_amount: rec.expected_amount,
          is_variable: rec.is_variable,
          is_recurring: true,
          billing_cycle: rec.billing_cycle,
          is_auto_paid: rec.is_auto_paid,
          due_day: rec.due_day,
          reference_month: monthYear,
          is_paid: Boolean(rec.is_auto_paid),
          paid_amount: rec.is_auto_paid ? rec.expected_amount : null,
        });
      }
    }

    if (missingToCopy.length > 0) {
      const { data: inserted, error: err3 } = await supabase
        .from('fixed_expenses')
        .insert(missingToCopy)
        .select();

      if (!err3 && inserted) {
        return [...(monthExpenses || []), ...inserted].sort((a, b) => a.due_day - b.due_day);
      }
    }

    return monthExpenses || [];
  },

  async getTransactions(userId: string, monthYear: string): Promise<Transaction[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_month', monthYear);

    if (error) throw new Error(`Erro ao buscar transações: ${error.message}`);
    return data || [];
  },

  async getShoppingSpent(userId: string, monthYear: string): Promise<number> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shopping_list')
      .select('total_price')
      .eq('user_id', userId)
      .eq('target_month', monthYear)
      .eq('status', 'Comprado');

    if (error) throw new Error(`Erro ao calcular gastos de compras: ${error.message}`);
    return (data || []).reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
  },

  async getGoals(userId: string): Promise<Goal[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar metas: ${error.message}`);
    return data || [];
  },

  async addFixedExpense(data: Partial<FixedExpense>): Promise<FixedExpense> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('fixed_expenses')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar despesa: ${error.message}`);
    return created;
  },

  async toggleExpensePaid(id: string, isPaid: boolean, paidAmount?: number | null) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('fixed_expenses')
      .update({ is_paid: isPaid, paid_amount: paidAmount })
      .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar despesa: ${error.message}`);
  },

  async updateFixedExpense(id: string, data: Partial<FixedExpense>) {
    const supabase = await createClient();
    const { error } = await supabase.from('fixed_expenses').update(data).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar despesa: ${error.message}`);
  },

  async deleteFixedExpense(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar despesa: ${error.message}`);
  },

  async addTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('transactions')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar transação: ${error.message}`);
    return created;
  },

  async updateTransaction(id: string, data: Partial<Transaction>) {
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').update(data).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar transação: ${error.message}`);
  },

  async deleteTransaction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar transação: ${error.message}`);
  },

  async addGoal(data: Partial<Goal>): Promise<Goal> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('goals')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar meta: ${error.message}`);
    return created;
  },

  async updateGoal(id: string, data: Partial<Goal>) {
    const supabase = await createClient();
    const { error } = await supabase.from('goals').update(data).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`);
  },

  async deleteGoal(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar meta: ${error.message}`);
  },

  async updateGoalAmount(goalId: string, newAmount: number) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId);

    if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`);
  },
};
