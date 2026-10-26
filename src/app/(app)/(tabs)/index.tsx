import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useCurrentMembership } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { DaySwitcher } from '../../../features/tasks/components/DaySwitcher';
import { TaskItem } from '../../../features/tasks/components/TaskItem';
import { todayKey } from '../../../features/tasks/dates';
import { useTasksForDay, useUpdateTaskStatus } from '../../../features/tasks/hooks';
import { countDone } from '../../../features/tasks/status';
import { toUserMessage } from '../../../lib/errors';

export default function TodayScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;

  const [date, setDate] = useState(todayKey);
  const { data: tasks, isLoading, error, refetch, isRefetching } = useTasksForDay(groupId, date);
  const statusMutation = useUpdateTaskStatus(groupId);

  const myTasks = (tasks ?? []).filter((task) => task.assigned_to === userId);
  const done = countDone(myTasks);
  const isManager = canManageTasks(membership?.role);

  return (
    <View style={styles.container}>
      <FlatList
        data={myTasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <DaySwitcher value={date} onChange={setDate} />
            {myTasks.length > 0 ? (
              <View style={styles.summary}>
                <Text variant="titleMedium">
                  Zrobione: {done} z {myTasks.length}
                </Text>
                <ProgressBar progress={done / myTasks.length} style={styles.progress} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.empty} />
          ) : error ? (
            <Text style={[styles.empty, styles.emptyText]}>{toUserMessage(error)}</Text>
          ) : (
            <View style={styles.empty}>
              <Text variant="titleMedium">Brak zadań na ten dzień 🎉</Text>
              {isManager ? (
                <Text variant="bodyMedium">Dodaj zadanie przyciskiem „+”.</Text>
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            canChangeStatus
            onChangeStatus={(status) => statusMutation.mutate({ id: item.id, status })}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
          />
        )}
      />

      {isManager ? (
        <FAB
          icon="plus"
          style={styles.fab}
          accessibilityLabel="Dodaj zadanie"
          onPress={() => router.push({ pathname: '/task/new', params: { date } })}
        />
      ) : null}

      <Snackbar visible={Boolean(statusMutation.error)} onDismiss={() => statusMutation.reset()}>
        {statusMutation.error ? toUserMessage(statusMutation.error) : ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 96 },
  header: { padding: 8, gap: 8 },
  summary: { paddingHorizontal: 8, gap: 8 },
  progress: { height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', gap: 4, marginTop: 48 },
  emptyText: { textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
