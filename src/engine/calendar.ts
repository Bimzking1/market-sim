export const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function gameStartDate(): number {
  return startOfDay(new Date()).getTime();
}

export function dateForDay(startDate: number, day: number): Date {
  return new Date(startDate + (day - 1) * DAY_MS);
}

export function addDays(startDate: number, days: number): number {
  return startDate + days * DAY_MS;
}

export function dayOffset(startDate: number, target: Date): number {
  const start = startOfDay(new Date(startDate));
  const t = startOfDay(target);
  return Math.round((t.getTime() - start.getTime()) / DAY_MS);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date): string {
  return dateFmt.format(date);
}

export function formatDateForDay(startDate: number, day: number): string {
  return formatDate(dateForDay(startDate, day));
}

const monthOnlyFmt = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

export function formatMonthYear(date: Date): string {
  return monthOnlyFmt.format(date);
}