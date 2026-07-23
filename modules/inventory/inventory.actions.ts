'use server';

import { protectedAction } from '@/lib/safe-action';
import { z } from 'zod';
import { inventoryService } from './inventory.service';
import { inventoryRepository } from './inventory.repository';
import {
  UpdateInventoryQtySchema,
  UpdateInventoryMinQtySchema,
  DeleteInventoryItemSchema,
  AddInventoryItemSchema,
  PromoPurchaseSchema,
} from './inventory.schema';
import { revalidatePath } from 'next/cache';

export const updateInventoryQtyAction = protectedAction
  .schema(UpdateInventoryQtySchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await inventoryService.updateQuantity(
      ctx.user.id,
      parsedInput.id,
      parsedInput.delta
    );
    revalidatePath('/inventory');
    return { success: true, ...res };
  });

export const updateInventoryMinQtyAction = protectedAction
  .schema(UpdateInventoryMinQtySchema)
  .action(async ({ parsedInput }) => {
    await inventoryRepository.updateMinQty(parsedInput.id, parsedInput.min_qty);
    revalidatePath('/inventory');
    return { success: true };
  });

export const deleteInventoryItemAction = protectedAction
  .schema(DeleteInventoryItemSchema)
  .action(async ({ parsedInput }) => {
    await inventoryRepository.delete(parsedInput.id);
    revalidatePath('/inventory');
    return { success: true };
  });

export const addInventoryItemAction = protectedAction
  .schema(AddInventoryItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await inventoryRepository.create({
      ...parsedInput,
      user_id: ctx.user.id,
    });
    revalidatePath('/inventory');
    return { success: true, data: created };
  });

export const promoPurchaseAction = protectedAction
  .schema(PromoPurchaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await inventoryService.promoPurchase(
      ctx.user.id,
      parsedInput.inventory_id,
      parsedInput.item_name,
      parsedInput.qty,
      parsedInput.price,
      parsedInput.target_month
    );
    revalidatePath('/inventory');
    revalidatePath('/shopping');
    revalidatePath('/dashboard');
    return { success: true, ...res };
  });

export const addToShoppingListFromInventoryAction = protectedAction
  .schema(
    z.object({
      inventory_id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
      target_month: z.string().regex(/^\d{4}-\d{2}$/),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    await supabase.from('shopping_list').insert([
      {
        user_id: ctx.user.id,
        inventory_id: parsedInput.inventory_id,
        name: parsedInput.name,
        market_name: 'Cooper A1',
        category: parsedInput.category,
        qty: 1,
        unit: 'UN',
        estimated_unit_price: 0,
        total_price: 0,
        target_month: parsedInput.target_month,
        status: 'Pendente',
      },
    ]);
    revalidatePath('/shopping');
    return { success: true };
  });
