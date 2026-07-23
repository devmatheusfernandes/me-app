import { createClient } from '@/lib/supabase/server';
import { financeRepository } from '@/modules/finance/finance.repository';
import { getCurrentMonthYear } from '@/lib/utils';
import { FinancialView } from './_components/FinancialView';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function FinancialPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const targetMonth = params.month || getCurrentMonthYear();

  const [expenses, transactions, goals] = await Promise.all([
    financeRepository.getFixedExpenses(user!.id, targetMonth),
    financeRepository.getTransactions(user!.id, targetMonth),
    financeRepository.getGoals(user!.id),
  ]);

  return (
    <FinancialView
      selectedMonth={targetMonth}
      expenses={expenses}
      transactions={transactions}
      goals={goals}
    />
  );
}
