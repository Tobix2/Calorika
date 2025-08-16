import { formatInTimeZone } from 'date-fns-tz';

// Ajustá la zona horaria a la tuya (ejemplo: Argentina GMT-3)
const TIMEZONE = 'America/Argentina/Buenos_Aires';

export function getDateKey(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
}
