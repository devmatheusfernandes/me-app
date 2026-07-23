import { createClient } from '@/lib/supabase/server';
import type { UserSettings } from '@/types';

export const settingsRepository = {
  async getSettings(userId: string): Promise<UserSettings | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar configurações: ${error.message}`);
    return data;
  },

  async saveSettings(userId: string, data: { default_market_limit: number; default_monthly_income: number; custom_markets?: string[] }): Promise<UserSettings> {
    const supabase = await createClient();
    const { data: saved, error } = await supabase
      .from('user_settings')
      .upsert(
        [
          {
            user_id: userId,
            default_market_limit: data.default_market_limit,
            default_monthly_income: data.default_monthly_income,
            custom_markets: data.custom_markets ?? [],
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar configurações: ${error.message}`);
    return saved;
  },

  async resetUserData(userId: string): Promise<void> {
    const supabase = await createClient();

    await supabase.from('monthly_summaries').delete().eq('user_id', userId);
    await supabase.from('fixed_expenses').delete().eq('user_id', userId);
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('inventory').delete().eq('user_id', userId);
    await supabase.from('shopping_list').delete().eq('user_id', userId);
    await supabase.from('goals').delete().eq('user_id', userId);
  },
};
