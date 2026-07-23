import { financeRepository } from './finance.repository';
import { settingsService } from '@/modules/settings/settings.service';
import { getNextMonthYear } from '@/lib/utils';

export const financeService = {
  async getDashboardData(userId: string, monthYear: string) {
    // 1. Get or create summary for this month
    let summary = await financeRepository.getMonthlySummary(userId, monthYear);
    if (!summary) {
      const userSettings = await settingsService.getSettings(userId);
      summary = await financeRepository.createMonthlySummary({
        user_id: userId,
        month_year: monthYear,
        total_income: Number(userSettings.default_monthly_income || 0),
        market_limit: Number(userSettings.default_market_limit || 2000),
        rollover_balance: 0.0, // Zerado por padrão para novo mês/conta
      });
    }

    // 2. Fetch expenses, transactions, shopping spent, goals
    const expenses = await financeRepository.getFixedExpenses(userId, monthYear);
    const transactions = await financeRepository.getTransactions(userId, monthYear);
    const gastoMercado = await financeRepository.getShoppingSpent(userId, monthYear);
    const goals = await financeRepository.getGoals(userId);

    // Calculate totals: sum of income transactions
    const receitas = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount || 0), Number(summary.total_income || 0));

    const outrasDepesas = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const despesasFixasTotal = expenses.reduce(
      (s, e) => s + Number(e.expected_amount || 0),
      0
    );
    const despesasFixasPagas = expenses
      .filter((e) => e.is_paid || e.is_auto_paid)
      .reduce((s, e) => s + Number(e.paid_amount ?? e.expected_amount ?? 0), 0);

    const despesasFixasPendentes = Math.max(0, despesasFixasTotal - despesasFixasPagas);
    const saldoLivre = receitas - despesasFixasTotal - outrasDepesas;

    const limiteBase = Number(summary.market_limit || 2000);
    const rollover = Number(summary.rollover_balance || 0);
    const limiteAjustado = limiteBase + rollover;
    const disponivelMercado = limiteAjustado - gastoMercado;
    const progressPct = Math.min((gastoMercado / (limiteAjustado || 1)) * 100, 100);

    return {
      monthYear,
      summary,
      receitas,
      outrasDepesas,
      despesasFixasTotal,
      despesasFixasPagas,
      despesasFixasPendentes,
      saldoLivre,
      limiteBase,
      rollover,
      limiteAjustado,
      gastoMercado,
      disponivelMercado,
      progressPct,
      expenses,
      goals,
      transactions,
    };
  },

  async allocateIncomeToGoal(
    userId: string,
    input: {
      goal_id: string;
      income_name?: string;
      amount: number;
      reference_month: string;
    }
  ) {
    // 1. Fetch target goal to increment current_amount
    const goals = await financeRepository.getGoals(userId);
    const targetGoal = goals.find((g) => g.id === input.goal_id);
    if (!targetGoal) throw new Error('Meta/Objetivo não encontrado');

    const newAmount = Number(targetGoal.current_amount || 0) + input.amount;
    await financeRepository.updateGoalAmount(input.goal_id, newAmount);

    // 2. Add an allocation expense transaction so it is deducted from free balance / unallocated income
    const desc = input.income_name ? ` (${input.income_name})` : '';
    await financeRepository.addTransaction({
      user_id: userId,
      type: 'expense',
      name: `Alocado p/ Meta: ${targetGoal.name}${desc}`,
      category: 'Metas',
      amount: input.amount,
      reference_month: input.reference_month,
      is_fixed: false,
    });

    return { success: true, newAmount, goalName: targetGoal.name };
  },

  async closeMonth(userId: string, currentMonthYear: string) {
    const currentData = await this.getDashboardData(userId, currentMonthYear);
    const nextMonthStr = getNextMonthYear(currentMonthYear);

    // Rollover = disponivelMercado (se sobrou é positivo, se estourou é negativo)
    const newRollover = currentData.disponivelMercado;

    // Check if next month summary already exists
    const existingNextSummary = await financeRepository.getMonthlySummary(userId, nextMonthStr);

    if (existingNextSummary) {
      // Update rollover in existing summary
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      await supabase
        .from('monthly_summaries')
        .update({ rollover_balance: newRollover })
        .eq('id', existingNextSummary.id);
    } else {
      // Create summary for next month with new rollover
      await financeRepository.createMonthlySummary({
        user_id: userId,
        month_year: nextMonthStr,
        total_income: currentData.summary.total_income,
        market_limit: currentData.summary.market_limit,
        rollover_balance: newRollover,
      });
    }

    return {
      nextMonth: nextMonthStr,
      newRollover,
      nextLimit: currentData.limiteBase + newRollover,
    };
  },
};
