// Hermes nie zawsze ma Intl.PluralRules, a i18next potrzebuje go do odmiany przez liczbę
import 'intl-pluralrules';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';
import { pl } from './locales/pl';
import { uk } from './locales/uk';

export type Language = 'pl' | 'en' | 'uk' | 'es';

export const DEFAULT_LANGUAGE: Language = 'pl';

// Nazwy języków zawsze w ich własnym języku, żeby każdy znalazł swój
export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'uk', label: 'Українська', flag: '🇺🇦' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

export const LANGUAGES: Language[] = LANGUAGE_OPTIONS.map((option) => option.value);

export const resources = {
  pl: { translation: pl },
  en: { translation: en },
  uk: { translation: uk },
  es: { translation: es },
};

// Własna instancja; initReactI18next udostępnia ją hookowi useTranslation
const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  // React sam zabezpiecza tekst, a podwójne escapowanie psułoby np. cudzysłowy
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
