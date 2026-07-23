import { Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Goal } from '@/types';

interface GoalsCardProps {
  goals: Goal[];
}

export function GoalsCard({ goals }: GoalsCardProps) {
  return (
    <div>
      <h3 className="text-base font-bold text-slate-200 mb-3">Objetivos</h3>
      {goals.length === 0 ? (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center text-xs text-slate-500">
          Nenhum objetivo cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.current_amount / (goal.target_amount || 1)) * 100)
            );
            const isEmerald = goal.name.toLowerCase().includes('emerg');

            return (
              <div
                key={goal.id || goal.name}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${
                    isEmerald ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                  }`}
                >
                  <Target
                    size={15}
                    className={isEmerald ? 'text-emerald-400' : 'text-blue-400'}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-200 mb-1 leading-tight line-clamp-1">
                  {goal.name}
                </p>
                <p className="text-[10px] text-slate-500 mb-2">
                  {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                </p>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isEmerald ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p
                  className={`text-[10px] font-bold ${
                    isEmerald ? 'text-emerald-500' : 'text-blue-500'
                  }`}
                >
                  {pct}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
