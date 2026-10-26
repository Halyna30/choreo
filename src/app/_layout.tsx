import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../lib/theme';

// TODO: w Etapie 4 zastąpimy to prawdziwą sesją z Supabase
const isLoggedIn = true;

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </PaperProvider>
  );
}