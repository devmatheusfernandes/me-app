'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Package, ShoppingBag } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/financial', label: 'Financeiro', icon: Wallet },
  { href: '/inventory', label: 'Estoque', icon: Package },
  { href: '/shopping', label: 'Compras', icon: ShoppingBag },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full md:max-w-md mx-auto md:bottom-5 bg-slate-950/95 md:bg-slate-900/90 backdrop-blur-xl border-t md:border border-slate-800/80 md:rounded-2xl px-3 py-2 flex justify-around items-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] md:shadow-2xl transition-all duration-300">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all active:scale-95 ${
              isActive
                ? 'text-blue-400 bg-blue-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
            <span className="text-[11px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
