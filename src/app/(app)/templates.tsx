import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, List, Text } from 'react-native-paper';
import { useCurrentMembership, useGroupMembers } from '../../features/groups/hooks';
import { canManageTasks } from '../../features/groups/roles';
import { memberLookup } from '../../features/groups/useMemberLookup';
import { describeAssignees } from '../../features/tasks/assignees';
import { useTemplates } from '../../features/tasks/hooks';
import { describeWeekdays } from '../../features/tasks/weekdays';
import { toUserMessage } from '../../lib/errors';

export default function TemplatesScreen() {
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const { data: templates, isLoading, error, refetch, isRefetching } = useTemplates(groupId);
  const { data: members } = useGroupMembers(groupId);
  const isManager = canManageTasks(membership?.role);

  const lookup = memberLookup(members);

  return (
    <FlatList
      data={templates ?? []}
      keyExtractor={(template) => template.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListHeaderComponent={
        isManager ? (
          <Button
            mode="contained"
            icon="plus"
            style={styles.add}
            onPress={() => router.push('/task/new')}
          >
            Nowe zadanie
          </Button>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator style={styles.empty} />
        ) : error ? (
          <Text style={styles.emptyText}>{toUserMessage(error)}</Text>
        ) : (
          <View style={styles.empty}>
            <Text variant="titleMedium">Brak zadań cyklicznych</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Przy dodawaniu zadania wybierz „Codziennie” albo „Wybrane dni”.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <List.Item
          title={item.title}
          description={[
            describeAssignees(item, lookup.nameOf),
            describeWeekdays(item.weekdays),
            item.is_active ? null : 'Wstrzymane',
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
