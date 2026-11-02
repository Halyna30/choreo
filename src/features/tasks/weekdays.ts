import type { TFunction } from 'i18next';
import { fromDateKey } from './dates';
import type { RepeatMode, TaskFormValues } from './types';

// Dzień tygodnia w standardzie ISO (poniedziałek = 1, niedziela = 7)
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

const WEEKDAY_KEYS = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  7: 'sun',
} as const satisfies Record<Weekday, string>;

export function weekdayShort(day: number, t: TFunction): string {
  return t(`weekdays.short.${WEEKDAY_KEYS[day as Weekday]}`);
}

export function isoWeekday(dateKey: string): number {
  const day = fromDateKey(dateKey).getDay();
  return day === 0 ? 7 : day;
}

function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}

export function describeWeekdays(weekdays: number[], t: TFunction): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  if (sorted.length === 7) return t('weekdays.daily');
  if (sameDays(sorted, [1, 2, 3, 4, 5])) return t('weekdays.workdays');
  if (sameDays(sorted, [6, 7])) return t('weekdays.weekends');
  return sorted.map((day) => weekdayShort(day, t)).join(', ');
}

// Wartości formularza -> dni tygodnia zapisywane w szablonie
export function weekdaysFromForm(values: Pick<TaskFormValues, 'repeat' | 'weekdays'>): number[] {
  return values.repeat === 'daily' ? ALL_WEEKDAYS : [...values.weekdays].sort((a, b) => a - b);
}

export function repeatModeFromWeekdays(weekdays: number[]): RepeatMode {
  return weekdays.length === 7 ? 'daily' : 'weekdays';
}
