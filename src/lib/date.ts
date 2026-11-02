export const APP_TIMEZONE = 'Africa/Cairo';

export function getCurrentCairoDateTime() {
  return new Date();
}

export function formatMatchDate(date: string | Date) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value);
}
