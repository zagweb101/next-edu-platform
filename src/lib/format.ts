/**
 * Format helpers — currency, date, numbers (locale-aware)
 */
export function formatCurrency(amount: number, locale = 'en-US', currency = 'SAR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(
  date: Date | string,
  locale = 'ar',
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const intlLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  try {
    return new Intl.DateTimeFormat(intlLocale, opts).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatNumber(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelative(date: Date | string, locale = 'ar') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const intlLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), 'month');
  return rtf.format(Math.round(diff / 31536000), 'year');
}

/**
 * Format a duration (in seconds) as a human-readable string.
 * Examples: 540 → "9 د" / "9m", 3600 → "1 س" / "1h", 0 → "—"
 */
export function formatDuration(seconds: number, locale = 'ar'): string {
  if (!seconds || seconds <= 0) return '—';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (locale === 'ar') {
    if (hours > 0 && minutes > 0) return `${hours} س ${minutes} د`;
    if (hours > 0) return `${hours} س`;
    return `${minutes} د`;
  }

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Format a duration (in seconds) as MM:SS or HH:MM:SS for video players.
 * Examples: 540 → "09:00", 3661 → "1:01:01"
 */
export function formatVideoTime(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
