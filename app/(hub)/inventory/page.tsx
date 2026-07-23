import { createClient } from '@/lib/supabase/server';
import { inventoryRepository } from '@/modules/inventory/inventory.repository';
import { getCurrentMonthYear } from '@/lib/utils';
import { InventoryView } from './_components/InventoryView';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const targetMonth = params.month || getCurrentMonthYear();

  const items = await inventoryRepository.findAll(user!.id);

  return <InventoryView initialItems={items} selectedMonth={targetMonth} />;
}
