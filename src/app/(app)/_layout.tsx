import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="task/new"
        options={{ title: 'Nowe zadanie', presentation: 'modal' }}
      />
    </Stack>
  );
}