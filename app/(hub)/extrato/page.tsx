import { createClient } from '@/lib/supabase/server';
import { financeRepository } from '@/modules/finance/finance.repository';
import { getCurrentMonthYear } from '@/lib/utils';
import { ExtratoView } from './_components/ExtratoView';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ExtratoPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const targetMonth = params.month || getCurrentMonthYear();

  // Fetch all data for extrato
  const [expenses, transactions, shoppingItems] = await Promise.all([
    financeRepository.getFixedExpenses(user!.id, targetMonth),
    financeRepository.getTransactions(user!.id, targetMonth),
    (async () => {
      const { data } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user!.id)
        .eq('target_month', targetMonth)
        .eq('status', 'Comprado')
        .order('created_at', { ascending: false });
      return data || [];
    })(),
  ]);

  // Build unified extract entries
  type ExtractEntry = {
    id: string;
    date: number;
    name: string;
    category: string;
    amount: number;
    type: 'income' | 'expense' | 'fixed' | 'shopping' | 'goal';
    source: 'Financeiro' | 'Compras';
    isPaid?: boolean;
    isFixed?: boolean;
  };

  const entries: ExtractEntry[] = [];

  // Income transactions
  transactions
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      entries.push({
        id: t.id!,
        date: t.date || 1,
        name: t.name,
        category: t.category || 'Receita',
        amount: Number(t.amount),
        type: 'income',
        source: 'Financeiro',
        isFixed: t.is_fixed,
      });
    });

  // Expense transactions (excluding meta allocations which we show separately)
  transactions
    .filter((t) => t.type === 'expense' && t.category !== 'Metas')
    .forEach((t) => {
      entries.push({
        id: t.id!,
        date: t.date || 1,
        name: t.name,
        category: t.category || 'Despesa',
        amount: Number(t.amount),
        type: 'expense',
        source: 'Financeiro',
      });
    });

  // Meta allocations
  transactions
    .filter((t) => t.type === 'expense' && t.category === 'Metas')
    .forEach((t) => {
      entries.push({
        id: t.id!,
        date: t.date || 1,
        name: t.name,
        category: 'Metas',
        amount: Number(t.amount),
        type: 'goal',
        source: 'Financeiro',
      });
    });

  // Fixed/one-time expenses (paid ones)
  expenses
    .filter((e) => e.is_paid || e.is_auto_paid)
    .forEach((e) => {
      entries.push({
        id: e.id!,
        date: e.due_day,
        name: e.name,
        category: e.is_recurring ? 'Despesa Fixa' : 'Despesa Pontual',
        amount: Number(e.paid_amount ?? e.expected_amount ?? 0),
        type: e.is_recurring ? 'fixed' : 'expense',
        source: 'Financeiro',
        isPaid: true,
        isFixed: e.is_recurring,
      });
    });

  // Shopping items (bought)
  shoppingItems.forEach((s: {
    id: string;
    name: string;
    market_name?: string;
    category?: string;
    total_price?: number;
    created_at?: string;
  }) => {
    entries.push({
      id: s.id,
      date: s.created_at ? new Date(s.created_at).getDate() : 1,
      name: s.name,
      category: s.category || 'Mercado',
      amount: Number(s.total_price || 0),
      type: 'shopping',
      source: 'Compras',
    });
  });

  // Sort by date descending
  entries.sort((a, b) => b.date - a.date);

  return <ExtratoView entries={entries} selectedMonth={targetMonth} />;
}
