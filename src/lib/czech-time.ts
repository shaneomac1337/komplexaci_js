const PRAGUE_TIME_ZONE = 'Europe/Prague';

function getPragueDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PRAGUE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
  };
}

function formatDateParts(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function addDaysToDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));

  return formatDateParts(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate()
  );
}

function getPragueOffsetMinutes(utcDate: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PRAGUE_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(utcDate);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localAsUtc = Date.UTC(
    Number(byType.year),
    Number(byType.month) - 1,
    Number(byType.day),
    Number(byType.hour),
    Number(byType.minute),
    Number(byType.second)
  );

  return Math.round((localAsUtc - utcDate.getTime()) / 60000);
}

export function getPragueDateString(date: Date = new Date()) {
  const parts = getPragueDateParts(date);
  return formatDateParts(parts.year, parts.month, parts.day);
}

export function getPreviousPragueDateString(date: Date = new Date()) {
  const parts = getPragueDateParts(date);
  return addDaysToDateString(formatDateParts(parts.year, parts.month, parts.day), -1);
}

export function hasPragueDateChanged(previous: Date, current: Date = new Date()) {
  return getPragueDateString(previous) !== getPragueDateString(current);
}

export function getPragueDateStartUtcString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  let utcMillis = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  for (let i = 0; i < 3; i++) {
    const offsetMinutes = getPragueOffsetMinutes(new Date(utcMillis));
    const nextUtcMillis = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000;

    if (nextUtcMillis === utcMillis) {
      break;
    }

    utcMillis = nextUtcMillis;
  }

  return new Date(utcMillis).toISOString();
}

export function getNextPragueDateString(dateString: string) {
  return addDaysToDateString(dateString, 1);
}
