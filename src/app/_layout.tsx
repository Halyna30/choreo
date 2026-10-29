import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { SettingsProvider, useSettings } from '../features/settings/SettingsProvider';
import { useStackOptions } from '../lib/navigation';
import { queryClient } from '../lib/queryClient';
import { buildTheme } from '../lib/theme';

// Ekran startowy zostaje, dopóki nie wczytamy czcionek, ustawień i sesji
SplashScreen.preventAutoHideAsync();

function RootNavigator({ assetsReady }: { assetsReady: boolean }) {
  const { session, isLoading } = useAuth();
  const stackOptions = useStackOptions();
  const isLoggedIn = Boolean(session);
  const isReady = assetsReady && !isLoading;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ ...stackOptions, headerShown: false }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
      {/* Wygląd można zmienić zawsze, także przed zalogowaniem */}
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, title: 'Wygląd', presentation: 'modal' }}
      />
    </Stack>
  );
}

function ThemedApp() {
  const { settings, isLoaded } = useSettings();
  const systemScheme = useColorScheme();

  const isDark =
    settings.colorMode === 'system' ? systemScheme === 'dark' : settings.colorMode === 'dark';
  const theme = buildTheme(settings.themeName, isDark);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // przy błędzie czcionek pokazujemy aplikację z czcionką systemową
  const assetsReady = isLoaded && (fontsLoaded || Boolean(fontError));

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator assetsReady={assetsReady} />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ThemedApp />
      </SettingsProvider>
    </QueryClientProvider>
  );
}
