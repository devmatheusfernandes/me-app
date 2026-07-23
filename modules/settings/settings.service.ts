import { settingsRepository } from './settings.repository';
import { createClient } from '@/lib/supabase/server';

export const settingsService = {
  async getSettings(userId: string) {
    const settings = await settingsRepository.getSettings(userId);
    return (
      settings || {
        user_id: userId,
        default_market_limit: 2000,
        default_monthly_income: 0,
        custom_markets: [] as string[],
      }
    );
  },

  async saveSettings(
    userId: string,
    data: { default_market_limit: number; default_monthly_income: number; custom_markets?: string[] },
    currentMonthYear: string
  ) {
    const saved = await settingsRepository.saveSettings(userId, data);

    // Also update current month's market_limit in monthly_summaries
    const supabase = await createClient();
    await supabase
      .from('monthly_summaries')
      .update({ market_limit: data.default_market_limit })
      .eq('user_id', userId)
      .eq('month_year', currentMonthYear);

    return saved;
  },

  async resetUserData(userId: string) {
    await settingsRepository.resetUserData(userId);
  },
};
