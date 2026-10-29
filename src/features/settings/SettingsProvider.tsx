import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import type { ColorMode, ThemeName } from '../../lib/theme';

type Settings = {
  themeName: ThemeName;
  colorMode: ColorMode;
};

type SettingsContextValue = {
  settings: Settings;
  isLoaded: boolean;
  setThemeName: (themeName: ThemeName) => void;
  setColorMode: (colorMode: ColorMode) => void;
};

const STORAGE_KEY = 'choreo.settings.v1';
const DEFAULT_SETTINGS: Settings = { themeName: 'family', colorMode: 'system' };

const THEME_NAMES: ThemeName[] = ['elegant', 'family', 'kids'];
const COLOR_MODES: ColorMode[] = ['system', 'light', 'dark'];

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  setThemeName: () => {},
  setColorMode: () => {},
});

// Wygląd to ustawienie tego telefonu, a nie całej grupy:
// każdy członek rodziny może mieć swój ulubiony motyw.
export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings>;
        setSettings({
          themeName: THEME_NAMES.includes(saved.themeName as ThemeName)
            ? (saved.themeName as ThemeName)
            : DEFAULT_SETTINGS.themeName,
          colorMode: COLOR_MODES.includes(saved.colorMode as ColorMode)
            ? (saved.colorMode as ColorMode)
            : DEFAULT_SETTINGS.colorMode,
        });
      })
      .catch(() => {
        // uszkodzony zapis – zostajemy przy domyślnych ustawieniach
      })
      .finally(() => setIsLoaded(true));
  }, []);

  function update(changes: Partial<Settings>) {
    setSettings((current) => {
      const next = { ...current, ...changes };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        setThemeName: (themeName) => update({ themeName }),
        setColorMode: (colorMode) => update({ colorMode }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
