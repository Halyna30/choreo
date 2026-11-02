import 'i18next';
import type { pl } from './locales/pl';

// Klucze tłumaczeń są sprawdzane przez TypeScript, np. t('nav.settings')
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof pl };
  }
}
