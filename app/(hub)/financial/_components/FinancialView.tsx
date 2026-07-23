'use client';

import { useState } from 'react';
import { FinancialTabs, type Tab } from './FinancialTabs';
import { FixedExpensesList } from './FixedExpensesList';
import { SubscriptionsList } from './SubscriptionsList';
import { IncomeList } from './IncomeList';
import { GoalsList } from './GoalsList';
import { AddExpenseSheet } from './AddExpenseSheet';
import { EditFinancialModal } from './EditFinancialModal';
import type { FixedExpense, Goal, Transaction } from '@/types';

interface FinancialViewProps {
  selectedMonth: string;
  expenses: FixedExpense[];
  transactions: Transaction[];
  goals: Goal[];
}

export function FinancialView({
  selectedMonth,
  expenses,
  transactions,
  goals,
}: FinancialViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fixas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    | { type: 'expense'; data: FixedExpense }
    | { type: 'income'; data: Transaction }
    | { type: 'goal'; data: Goal }
    | null
  >(null);

  return (
    <div className="p-5 pb-6">
      <div className="pt-2 mb-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
          Módulo
        </p>
        <h1 className="text-2xl font-bold text-slate-50">Financeiro</h1>
      </div>

      {/* Tabs */}
      <FinancialTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content by Tab */}
      {activeTab === 'fixas' && (
        <FixedExpensesList
          expenses={expenses}
          selectedMonth={selectedMonth}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onEdit={(exp) => setEditingItem({ type: 'expense', data: exp })}
        />
      )}

      {activeTab === 'assinaturas' && (
        <SubscriptionsList
          expenses={expenses}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onEdit={(exp) => setEditingItem({ type: 'expense', data: exp })}
        />
      )}

      {activeTab === 'receitas' && (
        <IncomeList
          transactions={transactions}
          selectedMonth={selectedMonth}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onEdit={(inc) => setEditingItem({ type: 'income', data: inc })}
        />
      )}

      {activeTab === 'metas' && (
        <GoalsList
          goals={goals}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onEdit={(goal) => setEditingItem({ type: 'goal', data: goal })}
        />
      )}

      {/* Add Modal Sheet */}
      <AddExpenseSheet
        activeTab={activeTab}
        selectedMonth={selectedMonth}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Modal Sheet */}
      <EditFinancialModal
        item={editingItem}
        selectedMonth={selectedMonth}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}
