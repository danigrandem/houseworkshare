/**
 * firstDayOfWeek: 0 = Sunday, 1 = Monday, ... 6 = Saturday (getDay() convention).
 */
export function getWeekStart(date: Date = new Date(), firstDayOfWeek: number = 1): Date {
  const d = new Date(date)
  const day = d.getDay()
  let diff: number
  if (firstDayOfWeek === 0) {
    diff = d.getDate() - day
  } else {
    diff = d.getDate() - day + (day === 0 ? -6 : 1)
  }
  const weekStart = new Date(d)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export function getWeekEnd(date: Date = new Date(), firstDayOfWeek: number = 1): Date {
  const weekStart = getWeekStart(date, firstDayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getWeekStartString(date: Date = new Date(), firstDayOfWeek: number = 1): string {
  return formatDate(getWeekStart(date, firstDayOfWeek))
}

export function getWeekEndString(date: Date = new Date(), firstDayOfWeek: number = 1): string {
  return formatDate(getWeekEnd(date, firstDayOfWeek))
}

export function isNewWeek(currentWeekStart: string, previousWeekStart: string | null): boolean {
  if (!previousWeekStart) return true
  return currentWeekStart !== previousWeekStart
}

export function getDaysRemainingInWeek(date: Date = new Date(), firstDayOfWeek: number = 1): number {
  const weekEnd = getWeekEnd(date, firstDayOfWeek)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = weekEnd.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function isDateInWeek(date: Date | string, weekStart: string, firstDayOfWeek: number = 1): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekStartDate = new Date(weekStart)
  const weekEndDate = getWeekEnd(weekStartDate, firstDayOfWeek)
  return d >= weekStartDate && d <= weekEndDate
}
