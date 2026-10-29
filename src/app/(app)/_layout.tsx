import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useCurrentMembership } from '../../features/groups/hooks';
import { toUserMessage } from '../../lib/errors';
import { useStackOptions } from '../../lib/navigation';
import { useAppTheme } from '../../lib/theme';

export default function AppLayout() {
  const theme = useAppTheme();
  const stackOptions = useStackOptions();
  const { data: membership, isLoading, error, refetch } = useCurrentMembership();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge">{toUserMessage(error)}</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Spróbuj ponownie
        </Button>
      </View>
    );
  }

  const hasGroup = Boolean(membership);

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Protected guard={hasGroup}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/new"
          options={{ title: 'Nowe zadanie', presentation: 'modal' }}
        />
        <Stack.Screen name="task/[id]" options={{ title: 'Zadanie', presentation: 'modal' }} />
        <Stack.Screen name="templates" options={{ title: 'Zadania cykliczne' }} />
        <Stack.Screen name="avatar" options={{ title: 'Awatar', presentation: 'modal' }} />
        <Stack.Screen name="goal/edit" options={{ title: 'Cel', presentation: 'modal' }} />
        <Stack.Screen
          name="template/[id]"
          options={{ title: 'Powtarzanie', presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/invite"
          options={{ title: 'Zaproś do grupy', presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/member/[userId]"
          options={{ title: 'Członek grupy', presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!hasGroup}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
});
