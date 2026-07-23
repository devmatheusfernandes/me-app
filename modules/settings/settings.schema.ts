import { z } from 'zod';

export const SaveSettingsSchema = z.object({
  default_market_limit: z.number().min(0, 'O limite deve ser zero ou maior'),
  default_monthly_income: z.number().min(0, 'A receita deve ser zero ou maior'),
  custom_markets: z.array(z.string().min(1)).default([]),
});

export type SaveSettingsInput = z.input<typeof SaveSettingsSchema>;
