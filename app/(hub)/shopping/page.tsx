import { createClient } from '@/lib/supabase/server';
import { shoppingService } from '@/modules/shopping/shopping.service';
import { financeRepository } from '@/modules/finance/finance.repository';
import { settingsService } from '@/modules/settings/settings.service';
import { getCurrentMonthYear } from '@/lib/utils';
import { ShoppingView } from './_components/ShoppingView';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ShoppingPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const targetMonth = params.month || getCurrentMonthYear();

  const [items, summary, settings] = await Promise.all([
    shoppingService.getItemsByMonth(user!.id, targetMonth),
    financeRepository.getMonthlySummary(user!.id, targetMonth),
    settingsService.getSettings(user!.id),
  ]);

  const limiteBase = Number(summary?.market_limit || 2000);
  const rollover = Number(summary?.rollover_balance || 0);
  const customMarkets = (settings?.custom_markets as string[] | undefined) ?? [];

  return (
    <ShoppingView
      initialItems={items}
      selectedMonth={targetMonth}
      limiteBase={limiteBase}
      rollover={rollover}
      customMarkets={customMarkets}
    />
  );
}
