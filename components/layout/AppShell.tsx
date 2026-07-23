'use client';

import React from 'react';
import { MonthHeader } from './MonthHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-6xl min-h-screen relative bg-slate-950 md:border-x border-slate-900 flex flex-col transition-all duration-300">
        {/* Sticky top header */}
        <MonthHeader />

        {/* Main scrollable content area */}
        <main className="flex-1 pt-[68px] pb-[88px] md:pb-[96px] px-2 sm:px-4 md:px-6 overflow-y-auto">
          {children}
        </main>

        {/* Sticky bottom navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
