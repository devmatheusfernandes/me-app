import { shoppingRepository } from './shopping.repository';
import { inventoryRepository } from '@/modules/inventory/inventory.repository';
import { financeRepository } from '@/modules/finance/finance.repository';
import { getCurrentMonthYear, getNextMonthYear } from '@/lib/utils';
import type { Category, Unit } from '@/types';
import type { AddShoppingItemInput, EditShoppingItemInput, AddBulkItemsFromNFCeInput } from './shopping.schema';

export const shoppingService = {
  async getItemsByMonth(userId: string, targetMonth: string) {
    return shoppingRepository.findByMonth(userId, targetMonth);
  },

  /**
   * Helper to ensure an item exists in inventory and increment its quantity.
   * If item has inventory_id linked -> increment that item.
   * Else -> search inventory by name (case-insensitive). If found -> link and increment. If not -> create new item in inventory!
   */
  async _addToInventory(userId: string, item: { id?: string; name: string; qty: number; unit: string; category?: string; inventory_id?: string | null }) {
    if (item.inventory_id) {
      await inventoryRepository.incrementQuantity(item.inventory_id, item.qty);
      return;
    }

    // Try finding existing inventory item by name for this user
    const userInventory = await inventoryRepository.findAll(userId);
    const existing = userInventory.find(
      (inv) => inv.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existing) {
      await inventoryRepository.incrementQuantity(existing.id!, item.qty);
      if (item.id) {
        // link for future toggles
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        await supabase.from('shopping_list').update({ inventory_id: existing.id }).eq('id', item.id);
      }
    } else {
      // Create new inventory item!
      const newInv = await inventoryRepository.create({
        user_id: userId,
        name: item.name,
        category: (item.category as Category) || 'Mercearia',
        current_qty: item.qty,
        min_qty: 1,
        unit: (item.unit as Unit) || 'UN',
        last_updated: new Date().toISOString(),
      });

      if (item.id && newInv?.id) {
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        await supabase.from('shopping_list').update({ inventory_id: newInv.id }).eq('id', item.id);
      }
    }
  },

  async markItemAsBought(userId: string, itemId: string) {
    const item = await shoppingRepository.findById(itemId);
    if (!item) throw new Error('Item não encontrado');
    if (item.user_id !== userId) throw new Error('Sem permissão');

    const newStatus = item.status === 'Comprado' ? 'Pendente' : 'Comprado';

    if (newStatus === 'Comprado') {
      // Business Rule 1: Create a linked expense transaction
      const totalPrice = Number(item.total_price || 0);
      const expense = await financeRepository.addTransaction({
        user_id: userId,
        type: 'expense',
        name: `${item.name} (${item.market_name})`,
        category: item.category || 'Mercearia',
        amount: totalPrice,
        reference_month: item.target_month,
        is_fixed: false,
      });

      await shoppingRepository.updateStatus(itemId, newStatus, expense.id);

      // Business Rule 2: Automatically add/increment to house inventory!
      await this._addToInventory(userId, item);

      return { newStatus, item };
    } else {
      // Business Rule: Unmark → delete the previously linked expense
      if (item.linked_expense_id) {
        try {
          const supabase = await (await import('@/lib/supabase/server')).createClient();
          await supabase.from('transactions').delete().eq('id', item.linked_expense_id);
        } catch {
          // Silently ignore if already deleted
        }
      }

      await shoppingRepository.updateStatus(itemId, newStatus, null);
      return { newStatus, item };
    }
  },

  async postponeItem(userId: string, itemId: string, currentMonth: string) {
    const item = await shoppingRepository.findById(itemId);
    if (!item) throw new Error('Item não encontrado');
    if (item.user_id !== userId) throw new Error('Sem permissão');

    const nextMonth = getNextMonthYear(currentMonth);
    await shoppingRepository.updateTargetMonth(itemId, nextMonth);

    return { nextMonth, item };
  },

  async addItem(userId: string, data: AddShoppingItemInput) {
    const totalPrice = Number(data.qty) * Number(data.estimated_unit_price || 0);
    const { min_qty, ...shoppingData } = data;
    
    const createdItem = await shoppingRepository.create({
      ...shoppingData,
      user_id: userId,
      total_price: totalPrice,
      status: 'Pendente',
    });

    if (min_qty !== undefined) {
      const userInventory = await inventoryRepository.findAll(userId);
      const existing = userInventory.find(
        (inv) => inv.name.trim().toLowerCase() === createdItem.name.trim().toLowerCase()
      );
      if (existing) {
        await inventoryRepository.updateMinQty(existing.id!, min_qty);
      } else {
        const newInv = await inventoryRepository.create({
          user_id: userId,
          name: createdItem.name,
          category: (createdItem.category as Category) || 'Mercearia',
          current_qty: 0,
          min_qty: min_qty,
          unit: (createdItem.unit as Unit) || 'UN',
          last_updated: new Date().toISOString(),
        });
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        await supabase.from('shopping_list').update({ inventory_id: newInv.id }).eq('id', createdItem.id);
      }
    }

    return createdItem;
  },

  async editItem(userId: string, data: EditShoppingItemInput) {
    const item = await shoppingRepository.findById(data.itemId);
    if (!item) throw new Error('Item não encontrado');
    if (item.user_id !== userId) throw new Error('Sem permissão');

    const qty = data.qty ?? item.qty;
    const price = data.estimated_unit_price ?? item.estimated_unit_price ?? 0;
    const totalPrice = Number(qty) * Number(price);

    const { min_qty, ...shoppingData } = data;

    const updated = await shoppingRepository.update(data.itemId, {
      name: shoppingData.name,
      market_name: shoppingData.market_name,
      category: shoppingData.category as Category,
      qty: shoppingData.qty,
      unit: shoppingData.unit as Unit,
      estimated_unit_price: shoppingData.estimated_unit_price,
      total_price: totalPrice,
      target_month: shoppingData.target_month,
    });

    if (min_qty !== undefined) {
      const userInventory = await inventoryRepository.findAll(userId);
      const existing = userInventory.find(
        (inv) => inv.name.trim().toLowerCase() === updated.name.trim().toLowerCase()
      );
      if (existing) {
        await inventoryRepository.updateMinQty(existing.id!, min_qty);
      } else {
        const newInv = await inventoryRepository.create({
          user_id: userId,
          name: updated.name,
          category: (updated.category as Category) || 'Mercearia',
          current_qty: 0,
          min_qty: min_qty,
          unit: (updated.unit as Unit) || 'UN',
          last_updated: new Date().toISOString(),
        });
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        await supabase.from('shopping_list').update({ inventory_id: newInv.id }).eq('id', updated.id);
      }
    }

    return updated;
  },

  /**
   * Import items from a scanned NFC-e (fiscal note).
   * - Global mode: all items imported as "Comprado", creates a bulk expense transaction + adds items to inventory.
   * - Within-market mode: match existing pending items by name, mark matched as bought.
   */
  async importFromNFCe(userId: string, input: AddBulkItemsFromNFCeInput) {
    const { items, market_name, target_month, total_amount, within_market_mode } = input;
    const targetMonth = target_month || getCurrentMonthYear();

    if (within_market_mode) {
      // Match existing pending items in this market by name (fuzzy: includes)
      const existing = await shoppingRepository.findByMarketAndMonth(userId, market_name, targetMonth);
      const pendingItems = existing.filter((e) => e.status === 'Pendente');

      const matchedIds: string[] = [];
      const unmatchedNfceItems: typeof items = [];

      for (const nfceItem of items) {
        const match = pendingItems.find(
          (p) => p.name.toLowerCase().includes(nfceItem.name.toLowerCase().slice(0, 4))
        );
        if (match) {
          matchedIds.push(match.id!);
        } else {
          unmatchedNfceItems.push(nfceItem);
        }
      }

      // Mark matched items as bought (creates individual expenses + adds to inventory)
      for (const id of matchedIds) {
        await this.markItemAsBought(userId, id);
      }

      // Add unmatched items as new "Comprado" items with linked expenses + add to inventory
      for (const nfceItem of unmatchedNfceItems) {
        const expense = await financeRepository.addTransaction({
          user_id: userId,
          type: 'expense',
          name: `${nfceItem.name} (${market_name})`,
          category: 'Mercearia',
          amount: nfceItem.total_price,
          reference_month: targetMonth,
          is_fixed: false,
        });

        const createdItem = await shoppingRepository.create({
          user_id: userId,
          name: nfceItem.name,
          market_name,
          category: 'Mercearia',
          qty: nfceItem.qty,
          unit: (nfceItem.unit as Unit) || 'UN',
          estimated_unit_price: nfceItem.unit_price,
          total_price: nfceItem.total_price,
          target_month: targetMonth,
          status: 'Comprado',
          linked_expense_id: expense.id,
        });

        // Add to inventory
        await this._addToInventory(userId, createdItem);
      }

      return { matchedCount: matchedIds.length, addedCount: unmatchedNfceItems.length };
    } else {
      // Global mode: create one bulk expense for total + individual shopping list items
      await financeRepository.addTransaction({
        user_id: userId,
        type: 'expense',
        name: `Compras em ${market_name}`,
        category: 'Mercado',
        amount: total_amount,
        reference_month: targetMonth,
        is_fixed: false,
      });

      const itemsToInsert = items.map((nfceItem) => ({
        user_id: userId,
        name: nfceItem.name,
        market_name,
        category: 'Mercearia' as const,
        qty: nfceItem.qty,
        unit: (nfceItem.unit as Unit) || 'UN',
        estimated_unit_price: nfceItem.unit_price,
        total_price: nfceItem.total_price,
        target_month: targetMonth,
        status: 'Comprado' as const,
      }));

      const created = await shoppingRepository.bulkCreate(itemsToInsert);

      // Add all created items to inventory
      for (const createdItem of created) {
        await this._addToInventory(userId, createdItem);
      }

      return { addedCount: created.length, matchedCount: 0 };
    }
  },
};
