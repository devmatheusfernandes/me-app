'use client';

import { useEffect, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMonthStore } from '@/store/useMonthStore';
import { formatMonthYearLabel, getNextMonthYear, getPrevMonthYear } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LogOut, Settings, Loader2 } from 'lucide-react';
import { signOutAction } from '@/modules/auth/auth.actions';
import Link from 'next/link';

export function MonthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { selectedMonth, setSelectedMonth } = useMonthStore();

  // Sync Zustand store with URL param on mount/change if URL has ?month=
  useEffect(() => {
    const monthInUrl = searchParams.get('month');
    if (monthInUrl && /^\d{4}-\d{2}$/.test(monthInUrl) && monthInUrl !== selectedMonth) {
      setSelectedMonth(monthInUrl);
    }
  }, [searchParams, selectedMonth, setSelectedMonth]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', newMonth);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePrevMonth = () => {
    const prev = getPrevMonthYear(selectedMonth);
    handleMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = getNextMonthYear(selectedMonth);
    handleMonthChange(next);
  };

  const label = formatMonthYearLabel(selectedMonth);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            Me
          </div>
          <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight md:block hidden">MeApp</span>
        </Link>

        {/* Month Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-inner">
          <button
            onClick={handlePrevMonth}
            disabled={isPending}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all disabled:opacity-50"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-200 min-w-[110px] flex items-center justify-center gap-1">
            {isPending && <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />}
            {label}
          </span>

          <button
            onClick={handleNextMonth}
            disabled={isPending}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all disabled:opacity-50"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all active:scale-90"
            title="Configurações"
          >
            <Settings size={16} />
          </Link>

          <button
            onClick={() => signOutAction()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all active:scale-90"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
