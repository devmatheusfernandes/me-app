import { createClient } from '@/lib/supabase/server';
import { financeService } from '@/modules/finance/finance.service';
import { getCurrentMonthYear } from '@/lib/utils';
import { DashboardView } from './_components/DashboardView';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const targetMonth = params.month || getCurrentMonthYear();

  const data = await financeService.getDashboardData(user!.id, targetMonth);

  return <DashboardView data={data} />;
}
