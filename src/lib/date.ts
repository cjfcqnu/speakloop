export function toDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function addDays(dateKey: string, days: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function isOnOrBeforeToday(dateKey: string): boolean {
  return dateKey <= toDateKey();
}

export function isSameDate(isoDate: string | undefined, dateKey: string): boolean {
  if (!isoDate) {
    return false;
  }
  return toDateKey(new Date(isoDate)) === dateKey;
}

export function formatDateLabel(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}
