import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, List, Text } from 'react-native-paper';
import { useCurrentMembership, useGroupMembers } from '../../features/groups/hooks';
import { canManageTasks } from '../../features/groups/roles';
import { memberLookup } from '../../features/groups/useMemberLookup';
import { describeAssignees } from '../../features/tasks/assignees';
import { useTemplates } from '../../features/tasks/hooks';
import { describeWeekdays } from '../../features/tasks/weekdays';
import { toUserMessage } from '../../lib/errors';

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const { data: templates, isLoading, error, refetch, isRefetching } = useTemplates(groupId);
  const { data: members } = useGroupMembers(groupId);
  const isManager = canManageTasks(membership?.role);
  const insets = useSafeAreaInsets();

  const lookup = memberLookup(members, t);

  return (
    <FlatList
      data={templates ?? []}
      keyExtractor={(template) => template.id}
      // miejsce na systemowy pasek nawigacji na dole ekranu
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      ListHeaderComponent={
        isManager ? (
          <Button
            mode="contained"
            icon="plus"
            style={styles.add}
            onPress={() => router.push('/task/new')}
          >
            {t('templates.newTask')}
          </Button>
        ) : undefined
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator style={styles.empty} />
        ) : error ? (
          <Text style={styles.emptyText}>{toUserMessage(error, t)}</Text>
        ) : (
          <View style={styles.empty}>
            <Text variant="titleMedium">{t('templates.empty')}</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('templates.emptyHint')}
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <List.Item
          title={item.title}
          description={[
            describeAssignees(item, lookup.nameOf, t),
            describeWeekdays(item.weekdays, t),
            item.is_active ? null : t('templates.paused'),
          ]
            .filter(Boolean)
            .join(' · ')}
          left={(props) => (
            <List.Icon {...props} icon={item.is_active ? 'repeat' : 'pause-circle-outline'} />
          )}
          right={isManager ? (props) => <List.Icon {...props} icon="chevron-right" /> : undefined}
          onPress={
            isManager
              ? () => router.push({ pathname: '/template/[id]', params: { id: item.id } })
              : undefined
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 8, paddingBottom: 32 },
  add: { margin: 8 },
  empty: { alignItems: 'center', gap: 4, marginTop: 48, paddingHorizontal: 24 },
  emptyText: { textAlign: 'center' },
});
