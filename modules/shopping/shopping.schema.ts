import { z } from 'zod';
import { CategoryEnum } from '@/types';

export const AddShoppingItemSchema = z.object({
  name: z.string().min(2, 'Nome do produto é obrigatório'),
  market_name: z.string().min(1, 'Selecione um mercado'),
  category: CategoryEnum.default('Mercearia'),
  qty: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  unit: z.enum(['UN', 'KG', 'G', 'L', 'ML', 'PCT', 'CX']).default('UN'),
  estimated_unit_price: z.number().min(0, 'Preço não pode ser negativo').default(0),
  target_month: z.string().regex(/^\d{4}-\d{2}$/),
  min_qty: z.number().min(0, 'Quantidade mínima não pode ser negativa').optional(),
});

export type AddShoppingItemInput = z.input<typeof AddShoppingItemSchema>;

export const EditShoppingItemSchema = AddShoppingItemSchema.extend({
  itemId: z.string().uuid(),
});

export type EditShoppingItemInput = z.input<typeof EditShoppingItemSchema>;

export const MarkBoughtSchema = z.object({
  itemId: z.string().uuid(),
});

export const PostponeItemSchema = z.object({
  itemId: z.string().uuid(),
  currentMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

// NFC-e scraping schemas
export const NfceItemSchema = z.object({
  name: z.string(),
  qty: z.number(),
  unit: z.string(),
  unit_price: z.number(),
  total_price: z.number(),
  min_qty: z.number().min(0).optional(),
});
export type NfceItem = z.infer<typeof NfceItemSchema>;

export const AddBulkItemsFromNFCeSchema = z.object({
  items: z.array(NfceItemSchema),
  market_name: z.string().min(1),
  target_month: z.string().regex(/^\d{4}-\d{2}$/),
  total_amount: z.number(),
  note_date: z.string().optional(),
  /** If provided, we're operating within a specific existing market — only match/mark */
  within_market_mode: z.boolean().default(false),
});
export type AddBulkItemsFromNFCeInput = z.infer<typeof AddBulkItemsFromNFCeSchema>;
