import React, { ReactNode, useState, createContext, useContext } from "react";
import { LayoutDashboard, Wallet, Boxes, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import "../_group.css";

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface MonthCtx { month: number; year: number; label: string; }
export const MonthContext = createContext<MonthCtx>({ month: 6, year: 2026, label: 'Julho 2026' });
export const useMonth = () => useContext(MonthContext);

interface AppLayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'financial' | 'inventory' | 'shopping' | 'none';
}

export function AppLayout({ children, activeTab }: AppLayoutProps) {
  const [month, setMonth] = useState(6); // 0-indexed, 6 = Julho
  const [year, setYear] = useState(2026);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const ctx: MonthCtx = { month, year, label: `${MONTHS[month]} ${year}` };

  return (
    <MonthContext.Provider value={ctx}>
      <div className="dark finapp-root min-h-screen bg-slate-950 text-slate-50 flex justify-center w-full">
        <div className="w-full max-w-[390px] bg-slate-950 relative flex flex-col h-[100dvh] overflow-hidden shadow-2xl shadow-black/50">

          {/* Global Month Selector — fixed header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 z-50">
            <button
              onClick={prev}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-90 transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex flex-col items-center select-none">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                Período
              </span>
              <span className="text-base font-bold text-slate-100 leading-tight">
                {ctx.label}
              </span>
            </div>

            <button
              onClick={next}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-90 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[100px] scrollbar-hide">
            {children}
          </main>

          {activeTab !== 'none' && (
            <nav className="absolute bottom-0 left-0 right-0 h-[84px] bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80 flex justify-around items-start pt-3 px-2 pb-safe z-50">
              <NavItem icon={<LayoutDashboard size={24} />} label="Início"    isActive={activeTab === 'dashboard'} />
              <NavItem icon={<Wallet size={24} />}          label="Finanças"  isActive={activeTab === 'financial'} />
              <NavItem icon={<Boxes size={24} />}           label="Estoque"   isActive={activeTab === 'inventory'} />
              <NavItem icon={<ShoppingCart size={24} />}    label="Mercado"   isActive={activeTab === 'shopping'} />
            </nav>
          )}
        </div>
      </div>
    </MonthContext.Provider>
  );
}

function NavItem({ icon, label, isActive }: { icon: ReactNode; label: string; isActive: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center w-[72px] gap-1.5 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
      <div className={`${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'scale-100'} transition-all duration-300`}>
        {icon}
      </div>
      <span className={`text-[11px] tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}
