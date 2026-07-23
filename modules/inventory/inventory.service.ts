import { inventoryRepository } from './inventory.repository';
import { createClient } from '@/lib/supabase/server';

export const inventoryService = {
  async getItems(userId: string) {
    return inventoryRepository.findAll(userId);
  },

  async updateQuantity(userId: string, itemId: string, delta: number) {
    const item = await inventoryRepository.findById(itemId);
    if (!item) throw new Error('Item do estoque não encontrado');
    if (item.user_id !== userId) throw new Error('Sem permissão');

    const newQty = Math.max(0, Number(item.current_qty) + delta);
    await inventoryRepository.updateQty(itemId, newQty);

    const hitMinimum = newQty <= Number(item.min_qty) && Number(item.current_qty) > Number(item.min_qty);

    return {
      newQty,
      hitMinimum,
      item: { ...item, current_qty: newQty },
    };
  },

  async promoPurchase(
    userId: string,
    inventoryId: string,
    itemName: string,
    qty: number,
    price: number,
    targetMonth: string
  ) {
    // 1. Increment inventory qty
    await inventoryRepository.incrementQuantity(inventoryId, qty);

    // 2. Add bought item to shopping list for target month so it abates budget
    const supabase = await createClient();
    const totalPrice = qty * price;

    const { error } = await supabase.from('shopping_list').insert([
      {
        user_id: userId,
        inventory_id: inventoryId,
        name: `${itemName} (Promoção)`,
        market_name: 'Promoção Avulsa',
        category: 'Outros',
        qty,
        unit: 'UN',
        estimated_unit_price: price,
        total_price: totalPrice,
        target_month: targetMonth,
        status: 'Comprado',
      },
    ]);

    if (error) throw new Error(`Erro ao registrar compra avulsa: ${error.message}`);
    return { totalPrice };
  },
};
