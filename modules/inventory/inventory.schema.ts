import { z } from 'zod';
import { CategoryEnum } from '@/types';

export const AddInventoryItemSchema = z.object({
  name: z.string().min(2, 'Nome do item é obrigatório'),
  category: CategoryEnum.default('Mercearia'),
  unit: z.enum(['UN', 'KG', 'G', 'L', 'ML', 'PCT', 'CX']).default('UN'),
  current_qty: z.number().min(0, 'Quantidade não pode ser negativa'),
  min_qty: z.number().min(0, 'Mínimo não pode ser negativo'),
});

export type AddInventoryItemInput = z.input<typeof AddInventoryItemSchema>;

export const UpdateInventoryQtySchema = z.object({
  id: z.string().uuid(),
  delta: z.number(), // +1 or -1
});

export const UpdateInventoryMinQtySchema = z.object({
  id: z.string().uuid(),
  min_qty: z.number().min(0, 'Quantidade mínima não pode ser negativa'),
});

export const DeleteInventoryItemSchema = z.object({
  id: z.string().uuid(),
});

export const PromoPurchaseSchema = z.object({
  inventory_id: z.string().uuid(),
  item_name: z.string(),
  qty: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  target_month: z.string().regex(/^\d{4}-\d{2}$/),
});

export type PromoPurchaseInput = z.infer<typeof PromoPurchaseSchema>;
