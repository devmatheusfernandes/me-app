'use server';

import { protectedAction } from '@/lib/safe-action';
import { shoppingService } from './shopping.service';
import {
  AddShoppingItemSchema,
  MarkBoughtSchema,
  PostponeItemSchema,
  AddBulkItemsFromNFCeSchema,
} from './shopping.schema';
import { revalidatePath } from 'next/cache';

export const addShoppingItemAction = protectedAction
  .schema(AddShoppingItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await shoppingService.addItem(ctx.user.id, parsedInput);
    revalidatePath('/shopping');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  });

export const markBoughtAction = protectedAction
  .schema(MarkBoughtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await shoppingService.markItemAsBought(ctx.user.id, parsedInput.itemId);
    revalidatePath('/shopping');
    revalidatePath('/inventory');
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true, ...res };
  });

export const postponeItemAction = protectedAction
  .schema(PostponeItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await shoppingService.postponeItem(
      ctx.user.id,
      parsedInput.itemId,
      parsedInput.currentMonth
    );
    revalidatePath('/shopping');
    revalidatePath('/dashboard');
    return { success: true, ...res };
  });

export const importFromNFCeAction = protectedAction
  .schema(AddBulkItemsFromNFCeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await shoppingService.importFromNFCe(ctx.user.id, parsedInput);
    revalidatePath('/shopping');
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true, ...res };
  });
