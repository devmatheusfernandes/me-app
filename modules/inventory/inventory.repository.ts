import { createClient } from '@/lib/supabase/server';
import type { InventoryItem } from '@/types';

export const inventoryRepository = {
  async findAll(userId: string): Promise<InventoryItem[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(`Erro ao buscar estoque: ${error.message}`);
    return data || [];
  },

  async findById(id: string): Promise<InventoryItem | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async create(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from('inventory')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar item no estoque: ${error.message}`);
    return created;
  },

  async updateQty(id: string, newQty: number) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('inventory')
      .update({ current_qty: newQty, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar quantidade do estoque: ${error.message}`);
  },

  async updateMinQty(id: string, minQty: number) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('inventory')
      .update({ min_qty: minQty, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar quantidade mínima do estoque: ${error.message}`);
  },

  async delete(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw new Error(`Erro ao remover item do estoque: ${error.message}`);
  },

  async incrementQuantity(id: string, qty: number) {
    const item = await this.findById(id);
    if (!item) return;
    const newQty = Number(item.current_qty || 0) + Number(qty);
    await this.updateQty(id, newQty);
  },
};
