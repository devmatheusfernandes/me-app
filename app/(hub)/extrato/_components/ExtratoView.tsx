'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Target,
  ReceiptText,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { formatCurrency, formatMonthYearLabel } from '@/lib/utils';

type ExtractEntry = {
  id: string;
  date: number;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'fixed' | 'shopping' | 'goal';
  source: 'Financeiro' | 'Compras';
  isPaid?: boolean;
  isFixed?: boolean;
};

interface ExtratoViewProps {
  entries: ExtractEntry[];
  selectedMonth: string;
}

const TYPE_LABELS: Record<ExtractEntry['type'], string> = {
  income: 'Receita',
  expense: 'Despesa',
  fixed: 'Despesa Fixa',
  shopping: 'Compra',
  goal: 'Meta',
};

const TYPE_COLORS: Record<ExtractEntry['type'], string> = {
  income: 'text-emerald-400',
  expense: 'text-orange-400',
  fixed: 'text-rose-400',
  shopping: 'text-blue-400',
  goal: 'text-purple-400',
};

const TYPE_BG: Record<ExtractEntry['type'], string> = {
  income: 'bg-emerald-500/10',
  expense: 'bg-orange-500/10',
  fixed: 'bg-rose-500/10',
  shopping: 'bg-blue-500/10',
  goal: 'bg-purple-500/10',
};

function TypeIcon({ type }: { type: ExtractEntry['type'] }) {
  const cls = `${TYPE_COLORS[type]} shrink-0`;
  if (type === 'income') return <ArrowUpRight size={16} className={cls} />;
  if (type === 'shopping') return <ShoppingBag size={16} className={cls} />;
  if (type === 'goal') return <Target size={16} className={cls} />;
  return <ArrowDownRight size={16} className={cls} />;
}

export function ExtratoView({ entries, selectedMonth }: ExtratoViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ExtractEntry['type'] | 'all'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'Financeiro' | 'Compras'>('all');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || e.type === filterType;
      const matchSource = filterSource === 'all' || e.source === filterSource;
      return matchSearch && matchType && matchSource;
    });
  }, [entries, search, filterType, filterSource]);

  // Summary totals from filtered
  const totalEntradas = filtered
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);
  const totalSaidas = filtered
    .filter((e) => e.type !== 'income')
    .reduce((s, e) => s + e.amount, 0);

  const activeFilters = [
    filterType !== 'all' && TYPE_LABELS[filterType],
    filterSource !== 'all' && filterSource,
  ].filter(Boolean);

  return (
    <div className="p-5 pb-8">
      {/* Header */}
      <div className="pt-2 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
          Módulo
        </p>
        <h1 className="text-2xl font-bold text-slate-50">Extrato</h1>
        <p className="text-xs text-slate-500 mt-0.5">{formatMonthYearLabel(selectedMonth)}</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1">
            Entradas
          </p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70 mb-1">
            Saídas
          </p>
          <p className="text-lg font-bold text-rose-400">{formatCurrency(totalSaidas)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex items-center gap-1 text-slate-500 shrink-0">
          <Filter size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Filtros:</span>
        </div>

        {/* Source filter */}
        {(['all', 'Financeiro', 'Compras'] as const).map((src) => (
          <button
            key={src}
            onClick={() => setFilterSource(src)}
            className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterSource === src
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {src === 'all' ? 'Todas as fontes' : src}
          </button>
        ))}

        <div className="w-px bg-slate-800 shrink-0" />

        {/* Type filter */}
        {(['all', 'income', 'fixed', 'expense', 'shopping', 'goal'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterType === t
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'all' ? 'Todos os tipos' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {activeFilters.map((f) => (
            <span
              key={f as string}
              className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full"
            >
              {f as string}
              <button
                onClick={() => {
                  if (f === filterSource) setFilterSource('all');
                  if (f === TYPE_LABELS[filterType as ExtractEntry['type']]) setFilterType('all');
                }}
                className="hover:text-blue-200"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Entry count */}
      <p className="text-xs text-slate-600 mb-3 font-medium">
        {filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}
      </p>

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center text-xs text-slate-500">
          Nenhum lançamento encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={`${entry.type}-${entry.id}`}
              className="flex items-center gap-3 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full ${TYPE_BG[entry.type]} flex items-center justify-center shrink-0`}>
                <TypeIcon type={entry.type} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-200 truncate">{entry.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[entry.type]}`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[10px] text-slate-500">{entry.category}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[10px] text-slate-600">dia {entry.date}</span>
                  {entry.source === 'Compras' && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
                        Compras
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <p className={`font-bold text-sm shrink-0 ${
                entry.type === 'income' ? 'text-emerald-400' : TYPE_COLORS[entry.type]
              }`}>
                {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
