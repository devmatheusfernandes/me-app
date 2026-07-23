import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { FixedExpense } from '@/types';

interface UpcomingBillsCardProps {
  expenses: FixedExpense[];
}

export function UpcomingBillsCard({ expenses }: UpcomingBillsCardProps) {
  const pending = expenses.filter((e) => !e.is_paid).slice(0, 4);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold text-slate-200">Próximos Vencimentos</h3>
        <Link
          href="/financial"
          className="text-xs font-semibold text-blue-500 hover:text-blue-400 uppercase tracking-wider"
        >
          Ver todos
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center text-xs text-slate-500">
          Nenhum vencimento pendente neste mês! 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((bill) => (
            <div
              key={bill.id || bill.name}
              className="flex justify-between items-center bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-1.5 h-10 rounded-full ${
                    bill.due_day <= 5 ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-200 text-sm">{bill.name}</p>
                    {bill.type === 'subscription' && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-md font-medium">
                        Assinatura
                      </span>
                    )}
                    {!bill.is_recurring && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-medium">
                        Avulsa
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      bill.due_day <= 5 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    Vence dia {bill.due_day}
                  </p>
                </div>
              </div>
              <p className="font-bold text-slate-200 text-sm">
                {formatCurrency(bill.expected_amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
