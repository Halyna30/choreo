import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { queryClient } from '../lib/queryClient';
import { theme } from '../lib/theme';

// Ekran startowy zostaje, dopóki nie sprawdzimy, czy użytkownik jest zalogowany
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const isLoggedIn = Boolean(session);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
