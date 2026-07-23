import { createClient } from '@/lib/supabase/server';
import type { ShoppingItem } from '@/types';

export const shoppingRepository = {
  async findByMonth(userId: string, targetMonth: string): Promise<ShoppingItem[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', userId)
      .eq('target_month', targetMonth)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar lista de compras: ${error.message}`);
    return data || [];
  },

  async findById(id: string): Promise<ShoppingItem | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async findByMarketAndMonth(userId: string, marketName: string, targetMonth: string): Promise<ShoppingItem[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', userId)
      .eq('market_name', marketName)
      .eq('target_month', targetMonth)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar itens do mercado: ${error.message}`);
    return data || [];
  },

  async create(data: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('shopping_list')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar item de compra: ${error.message}`);
    return created;
  },

  async bulkCreate(items: Partial<ShoppingItem>[]): Promise<ShoppingItem[]> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('shopping_list')
      .insert(items)
      .select();

    if (error) throw new Error(`Erro ao importar itens de compra: ${error.message}`);
    return created || [];
  },

  async updateStatus(id: string, status: 'Pendente' | 'Comprado' | 'Adiado', linkedExpenseId?: string | null) {
    const supabase = await createClient();
    const updatePayload: Record<string, unknown> = { status };
    if (linkedExpenseId !== undefined) {
      updatePayload['linked_expense_id'] = linkedExpenseId;
    }
    const { error } = await supabase
      .from('shopping_list')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar status do item: ${error.message}`);
  },

  async updateTargetMonth(id: string, newTargetMonth: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('shopping_list')
      .update({ target_month: newTargetMonth, status: 'Adiado' })
      .eq('id', id);

    if (error) throw new Error(`Erro ao adiar item: ${error.message}`);
  },
};
