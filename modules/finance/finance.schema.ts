import { z } from 'zod';

export const AddExpenseSchema = z.object({
  name: z.string().min(2, 'Nome da conta é obrigatório'),
  type: z.enum(['expense', 'subscription']).default('expense'),
  expected_amount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  is_variable: z.boolean().default(false),
  is_recurring: z.boolean().default(true),
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
  is_auto_paid: z.boolean().default(false),
  due_day: z.number().min(1).max(31),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/),
});

export type AddExpenseInput = z.input<typeof AddExpenseSchema>;

export const EditExpenseSchema = AddExpenseSchema.extend({
  id: z.string().uuid(),
});

export const ToggleExpensePaidSchema = z.object({
  id: z.string().uuid(),
  is_paid: z.boolean(),
  paid_amount: z.number().optional().nullable(),
});

export const AddIncomeSchema = z.object({
  name: z.string().min(2, 'Nome da receita é obrigatório'),
  amount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  date: z.number().min(1).max(31).default(1),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/),
  is_fixed: z.boolean().default(true),
});

export type AddIncomeInput = z.input<typeof AddIncomeSchema>;

export const EditIncomeSchema = AddIncomeSchema.extend({
  id: z.string().uuid(),
});

export const DeleteTransactionSchema = z.object({
  id: z.string().uuid(),
});

export const AddGoalSchema = z.object({
  name: z.string().min(2, 'Nome do objetivo é obrigatório'),
  target_amount: z.number().min(1, 'Meta deve ser maior que zero'),
  current_amount: z.number().min(0).default(0),
  color: z.enum(['emerald', 'blue', 'amber']).default('emerald'),
});

export type AddGoalInput = z.input<typeof AddGoalSchema>;

export const EditGoalSchema = AddGoalSchema.extend({
  id: z.string().uuid(),
});

export const DeleteGoalSchema = z.object({
  id: z.string().uuid(),
});

export const GoalContributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Aporte deve ser maior que zero'),
});
