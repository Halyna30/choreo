import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * Na webie przy renderowaniu statycznym zwracamy 'light',
 * dopóki aplikacja nie załaduje się w przeglądarce.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,  // w przeglądarce
    () => false, // podczas renderowania na serwerze
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}