import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function getCurrentMonthYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function formatMonthYearLabel(monthYear: string): string {
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) return monthYear
  const [year, month] = monthYear.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const monthName = date.toLocaleString('pt-BR', { month: 'long' })
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  return `${capitalized} ${year}`
}

export function getNextMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  const nextDate = new Date(year, month, 1) // month is 1-indexed here, so Date(year, month, 1) goes to next month
  const nextYear = nextDate.getFullYear()
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

export function getPrevMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0')
  return `${prevYear}-${prevMonth}`
}
