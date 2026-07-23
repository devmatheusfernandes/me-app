'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveSettingsSchema, type SaveSettingsInput } from '@/modules/settings/settings.schema';
import { saveSettingsAction, resetUserDataAction } from '@/modules/settings/settings.actions';
import { useMonthStore } from '@/store/useMonthStore';
import { toast } from 'sonner';
import { Loader2, Save, ShoppingBag, Wallet, Trash2, AlertTriangle, Store, Plus, X } from 'lucide-react';
import type { UserSettings } from '@/types';

const DEFAULT_MARKETS = ['Cooper A1', 'Supermercado Veneza', 'Atacadão', 'Outros'];

interface SettingsFormProps {
  initialSettings: UserSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { selectedMonth } = useMonthStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [customMarkets, setCustomMarkets] = useState<string[]>(
    (initialSettings.custom_markets as string[] | undefined) ?? []
  );
  const [newMarket, setNewMarket] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SaveSettingsInput>({
    resolver: zodResolver(SaveSettingsSchema),
    defaultValues: {
      default_market_limit: Number(initialSettings.default_market_limit || 2000),
      default_monthly_income: Number(initialSettings.default_monthly_income || 0),
      custom_markets: customMarkets,
    },
  });

  const handleAddMarket = () => {
    const trimmed = newMarket.trim();
    if (!trimmed || customMarkets.includes(trimmed) || DEFAULT_MARKETS.includes(trimmed)) return;
    setCustomMarkets((prev) => [...prev, trimmed]);
    setNewMarket('');
  };

  const handleRemoveMarket = (name: string) => {
    setCustomMarkets((prev) => prev.filter((m) => m !== name));
  };

  const onSubmit = async (data: SaveSettingsInput) => {
    const res = await saveSettingsAction({
      ...data,
      custom_markets: customMarkets,
      currentMonth: selectedMonth,
    });

    if (res?.data?.success) {
      toast.success('Configurações salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleResetAllData = async () => {
    setIsResetting(true);
    try {
      const res = await resetUserDataAction({});
      if (res?.data?.success) {
        toast.success('Todas as movimentações foram apagadas com sucesso! Sua conta foi resetada.');
        setIsResetConfirmOpen(false);
        window.location.href = '/dashboard';
      } else {
        toast.error('Erro ao resetar os dados');
      }
    } catch {
      toast.error('Erro de conexão ao resetar dados');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Card Limite Mercado */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Limite Mensal do Mercado</h3>
              <p className="text-xs text-slate-500">Defina o limite padrão para suas compras</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Limite Padrão (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="2000.00"
              {...register('default_market_limit', { valueAsNumber: true })}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.default_market_limit && (
              <p className="text-xs text-rose-500 mt-1">{errors.default_market_limit.message}</p>
            )}
          </div>
        </div>

        {/* Card Receita Base */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Receita Padrão Mensal</h3>
              <p className="text-xs text-slate-500">
                Valor inicial da sua renda base (ou 0 se lançar mensalmente)
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Receita Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('default_monthly_income', { valueAsNumber: true })}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.default_monthly_income && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.default_monthly_income.message}
              </p>
            )}
          </div>
        </div>

        {/* Card Mercados Customizados */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Store size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Meus Mercados</h3>
              <p className="text-xs text-slate-500">Adicione mercados para usar na lista de compras</p>
            </div>
          </div>

          {/* Default markets (non-removable) */}
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Padrão</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_MARKETS.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Custom markets */}
          {customMarkets.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Personalizados</p>
              <div className="flex flex-wrap gap-2">
                {customMarkets.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-medium border border-purple-500/20"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => handleRemoveMarket(m)}
                      className="text-purple-400/50 hover:text-rose-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add new market */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMarket}
              onChange={(e) => setNewMarket(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMarket())}
              placeholder="Nome do mercado..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddMarket}
              disabled={!newMarket.trim()}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save size={18} /> Salvar Configurações
            </>
          )}
        </button>
      </form>

      {/* Danger Zone: Reset Data */}
      <div className="pt-6 border-t border-slate-800/80">
        <div className="bg-rose-500/5 rounded-2xl p-5 border border-rose-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Trash2 size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-400">Zona de Perigo</h3>
              <p className="text-xs text-slate-500">
                Zere todas as suas movimentações para iniciar uma nova conta do zero
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
          >
            <Trash2 size={16} /> Zerar Todas as Movimentações
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isResetting && setIsResetConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-rose-500/30 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-lg text-slate-100 mb-1">Zerar Todos os Dados?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta ação vai remover permanentemente <strong>todas as despesas, receitas, itens de estoque, listas de compras e metas</strong> da sua conta. Esta operação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl py-3 text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetAllData}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl py-3 text-sm shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Zerando...
                  </>
                ) : (
                  'Sim, Zerar Tudo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
