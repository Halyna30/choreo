import { fromDateKey } from './dates';
import type { RepeatMode, TaskFormValues } from './types';

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: 'Pn' },
  { value: 2, short: 'Wt' },
  { value: 3, short: 'Śr' },
  { value: 4, short: 'Cz' },
  { value: 5, short: 'Pt' },
  { value: 6, short: 'So' },
  { value: 7, short: 'Nd' },
];

// Dzień tygodnia w standardzie ISO (poniedziałek = 1, niedziela = 7)
export function isoWeekday(dateKey: string): number {
  const day = fromDateKey(dateKey).getDay();
  return day === 0 ? 7 : day;
}

function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}

export function describeWeekdays(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Codziennie';
  if (sameDays(sorted, [1, 2, 3, 4, 5])) return 'W dni robocze';
  if (sameDays(sorted, [6, 7])) return 'W weekendy';
  return sorted
    .map((day) => WEEKDAYS.find((weekday) => weekday.value === day)?.short)
    .join(', ');
}

// Wartości formularza -> dni tygodnia zapisywane w szablonie
export function weekdaysFromForm(values: Pick<TaskFormValues, 'repeat' | 'weekdays'>): number[] {
  return values.repeat === 'daily' ? ALL_WEEKDAYS : [...values.weekdays].sort((a, b) => a - b);
}

export function repeatModeFromWeekdays(weekdays: number[]): RepeatMode {
  return weekdays.length === 7 ? 'daily' : 'weekdays';
}
