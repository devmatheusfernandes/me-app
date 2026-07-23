import { create } from 'zustand';
import { getCurrentMonthYear, getNextMonthYear, getPrevMonthYear } from '@/lib/utils';

interface MonthState {
  selectedMonth: string; // Format "YYYY-MM"
  setSelectedMonth: (monthYear: string) => void;
  nextMonth: () => void;
  prevMonth: () => void;
}

export const useMonthStore = create<MonthState>((set) => ({
  selectedMonth: getCurrentMonthYear(),
  setSelectedMonth: (monthYear) => set({ selectedMonth: monthYear }),
  nextMonth: () => set((state) => ({ selectedMonth: getNextMonthYear(state.selectedMonth) })),
  prevMonth: () => set((state) => ({ selectedMonth: getPrevMonthYear(state.selectedMonth) })),
}));
