'use client';

export type Tab = 'fixas' | 'assinaturas' | 'receitas' | 'metas';

interface FinancialTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function FinancialTabs({ activeTab, setActiveTab }: FinancialTabsProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'fixas', label: 'Despesas' },
    { id: 'assinaturas', label: 'Assinaturas' },
    { id: 'receitas', label: 'Receitas' },
    { id: 'metas', label: 'Metas' },
  ];

  return (
    <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6 gap-0.5 shadow-inner">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === t.id
              ? 'bg-slate-800 text-slate-50 shadow-md border border-slate-700/50'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
