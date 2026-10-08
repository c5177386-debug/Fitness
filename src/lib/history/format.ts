/**
 * Locale-aware formatters for history entries.
 * Dates render in the visitor's own timezone; only called client-side.
 */

export function formatEntryDate(locale: string, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !locale.startsWith('zh'),
  }).format(date);
}

export function formatEntryNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
