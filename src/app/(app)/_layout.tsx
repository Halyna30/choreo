import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useCurrentMembership } from '../../features/groups/hooks';
import { toUserMessage } from '../../lib/errors';
import { useStackOptions } from '../../lib/navigation';
import { useAppTheme } from '../../lib/theme';

export default function AppLayout() {
  const { t } = useTranslation();
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
        <Text variant="bodyLarge">{toUserMessage(error, t)}</Text>
        <Button mode="contained" onPress={() => refetch()}>
          {t('common.retry')}
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
          options={{ title: t('nav.newTask'), presentation: 'modal' }}
        />
        <Stack.Screen name="task/[id]" options={{ title: t('nav.task'), presentation: 'modal' }} />
        <Stack.Screen name="templates" options={{ title: t('nav.templates') }} />
        <Stack.Screen name="avatar" options={{ title: t('nav.avatar'), presentation: 'modal' }} />
        <Stack.Screen name="goal/edit" options={{ title: t('nav.goal'), presentation: 'modal' }} />
        <Stack.Screen
          name="template/[id]"
          options={{ title: t('nav.template'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/invite"
          options={{ title: t('nav.invite'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="group/member/[userId]"
          options={{ title: t('nav.member'), presentation: 'modal' }}
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
