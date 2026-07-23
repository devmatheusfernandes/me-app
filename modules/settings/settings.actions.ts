'use server';

import { protectedAction } from '@/lib/safe-action';
import { SaveSettingsSchema } from './settings.schema';
import { settingsService } from './settings.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const saveSettingsAction = protectedAction
  .schema(
    SaveSettingsSchema.extend({
      currentMonth: z.string().regex(/^\d{4}-\d{2}$/),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const saved = await settingsService.saveSettings(
      ctx.user.id,
      {
        default_market_limit: parsedInput.default_market_limit,
        default_monthly_income: parsedInput.default_monthly_income,
        custom_markets: parsedInput.custom_markets,
      },
      parsedInput.currentMonth
    );

    revalidatePath('/dashboard');
    revalidatePath('/financial');
    revalidatePath('/inventory');
    revalidatePath('/shopping');
    revalidatePath('/settings');

    return { success: true, data: saved };
  });

export const resetUserDataAction = protectedAction
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    await settingsService.resetUserData(ctx.user.id);

    revalidatePath('/dashboard');
    revalidatePath('/financial');
    revalidatePath('/inventory');
    revalidatePath('/shopping');
    revalidatePath('/settings');

    return { success: true };
  });
