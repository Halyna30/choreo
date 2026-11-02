import type { pl } from './locales/pl';

// Każde tłumaczenie musi mieć dokładnie te same klucze co polski wzór
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

export type Translation = DeepStrings<typeof pl>;
