import { z } from 'zod';

// ==========================================
// 1. ENUMS E TIPOS REUTILIZÁVEIS
// ==========================================

// Formato padrão de mês/ano para gerir os meses (ex: "2026-07")
export const MonthYearSchema = z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido. Use YYYY-MM");

export const UnitEnum = z.enum(["UN", "KG", "G", "L", "ML", "PCT", "CX"]);
export const MarketEnum = z.enum(["Cooper A1", "Supermercado Veneza", "Atacadão", "Outros"]);
export const ShoppingStatusEnum = z.enum(["Pendente", "Comprado", "Adiado"]);

// Categorias
export const CategoryEnum = z.enum([
  "Doces e Snacks",
  "Bebidas",
  "Hortifruti",
  "Frios e Laticínios",
  "Mercearia",
  "Higiene Pessoal",
  "Padaria",
  "Carnes",
  "Congelados",
  "Utilidades",
  "Casa",
  "Outros"
]);

export type Category = z.infer<typeof CategoryEnum>;
export type Unit = z.infer<typeof UnitEnum>;
export type Market = z.infer<typeof MarketEnum>;
export type ShoppingStatus = z.infer<typeof ShoppingStatusEnum>;

// ==========================================
// 2. RESUMO MENSAL (Rollover e Limites)
// ==========================================
export const MonthlySummarySchema = z.object({
  id: z.uuid().optional(), // Gerado pelo Supabase
  user_id: z.uuid(),
  month_year: MonthYearSchema,
  total_income: z.number().min(0).default(0), // Ex: R$ 7.000,00
  market_limit: z.number().min(0).default(2000), // Ex: R$ 2.000,00 padrão
  rollover_balance: z.number().default(0), // Valor do mês anterior (Pode ser negativo se estourou)
  created_at: z.iso.datetime().optional(),
});
export type MonthlySummary = z.infer<typeof MonthlySummarySchema>;

// ==========================================
// 2.1 CONFIGURAÇÕES DO USUÁRIO
// ==========================================
export const UserSettingsSchema = z.object({
  user_id: z.uuid().optional(),
  default_market_limit: z.number().min(0).default(2000),
  default_monthly_income: z.number().min(0).default(0),
  custom_markets: z.array(z.string()).default([]),
  updated_at: z.string().datetime().optional(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// ==========================================
// 3. DESPESAS FIXAS E ASSINATURAS
// ==========================================
export const ExpenseTypeEnum = z.enum(["expense", "subscription"]);
export const BillingCycleEnum = z.enum(["monthly", "yearly"]);

export const FixedExpenseSchema = z.object({
  id: z.uuid().optional(),
  user_id: z.uuid(),
  name: z.string().min(2, "Nome da conta é obrigatório"), // Ex: "Luz", "Google One"
  type: ExpenseTypeEnum.default("expense"), // "expense" (conta fixas) vs "subscription" (assinatura)
  expected_amount: z.number().min(0),
  is_variable: z.boolean().default(false), // Ex: água/luz variam todo mês
  is_recurring: z.boolean().default(true), // TRUE = Recorrente (Fixa/Assinatura), FALSE = Pontual (Avulsa)
  billing_cycle: BillingCycleEnum.default("monthly"), // "monthly" ou "yearly"
  is_auto_paid: z.boolean().default(false), // Assinaturas no cartão marcam como pagas automaticamente
  due_day: z.number().min(1).max(31), // Dia do vencimento
  reference_month: MonthYearSchema, 
  is_paid: z.boolean().default(false),
  paid_amount: z.number().nullable().optional(), // Caso o valor pago seja diferente da previsão
  created_at: z.string().datetime().optional(),
});
export type FixedExpense = z.infer<typeof FixedExpenseSchema>;

// ==========================================
// 3.1 TRANSAÇÕES (Receitas / Despesas Avulsas)
// ==========================================
export const TransactionSchema = z.object({
  id: z.uuid().optional(),
  user_id: z.uuid(),
  type: z.enum(['income', 'expense']).default('income'),
  name: z.string().min(2),
  category: z.string().default('Outros'),
  amount: z.number().min(0),
  date: z.number().min(1).max(31).default(1),
  reference_month: MonthYearSchema,
  is_fixed: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

// ==========================================
// 4. ESTOQUE DOMÉSTICO (Inventário)
// ==========================================
export const InventoryItemSchema = z.object({
  id: z.uuid().optional(),
  user_id: z.uuid(),
  name: z.string().min(2, "Nome do item é obrigatório"),
  category: CategoryEnum,
  unit: UnitEnum,
  current_qty: z.number().min(0),
  min_qty: z.number().min(0), // Gatilho para ir para a lista de compras
  last_updated: z.string().datetime().optional(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// ==========================================
// 5. LISTA DE COMPRAS (Mercado)
// ==========================================
export const ShoppingItemSchema = z.object({
  id: z.uuid().optional(),
  user_id: z.uuid(),
  inventory_id: z.uuid().nullable().optional(), // Link com o estoque, se existir
  linked_expense_id: z.uuid().nullable().optional(), // Link com a transação de despesa gerada ao marcar como comprado
  name: z.string().min(2, "O nome do produto é obrigatório"),
  market_name: z.string().default("Cooper A1"), // Aceita mercados customizados
  category: CategoryEnum,
  qty: z.number().min(0.01, "A quantidade deve ser maior que zero"),
  unit: UnitEnum,
  estimated_unit_price: z.number().min(0).default(0), // Preço unitário previsto/real
  total_price: z.number().min(0).default(0), // Qty * estimated_unit_price
  target_month: MonthYearSchema, // Mês em que a compra deve ser feita (permite adiar)
  status: ShoppingStatusEnum.default("Pendente"),
  created_at: z.iso.datetime().optional(),
});
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

// ==========================================
// 6. METAS FINANCEIRAS
// ==========================================
export const GoalSchema = z.object({
  id: z.uuid().optional(),
  user_id: z.uuid(),
  name: z.string().min(2), // Ex: "Reserva de Emergência", "Carro"
  target_amount: z.number().min(1), // Ex: 10000, 40000
  current_amount: z.number().min(0).default(0),
  color: z.enum(["emerald", "blue", "amber"]).optional(),
  created_at: z.string().datetime().optional(),
});
export type Goal = z.infer<typeof GoalSchema>;