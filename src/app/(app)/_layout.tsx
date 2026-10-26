import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useCurrentMembership } from '../../features/groups/hooks';
import { toUserMessage } from '../../lib/errors';

export default function AppLayout() {
  const { data: membership, isLoading, error, refetch } = useCurrentMembership();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge">{toUserMessage(error)}</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Spróbuj ponownie
        </Button>
      </View>
    );
  }

  const hasGroup = Boolean(membership);

  return (
    <Stack>
      <Stack.Protected guard={hasGroup}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/new"
          options={{ title: 'Nowe zadanie', presentation: 'modal' }}
        />
        <Stack.Screen name="task/[id]" options={{ title: 'Zadanie', presentation: 'modal' }} />
        <Stack.Screen name="templates" options={{ title: 'Zadania cykliczne' }} />
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
