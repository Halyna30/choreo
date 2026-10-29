import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Snackbar, Text } from 'react-native-paper';
import { ProgressHero } from '../../../components/ProgressHero';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useCurrentMembership } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { DaySwitcher } from '../../../features/tasks/components/DaySwitcher';
import { TaskItem } from '../../../features/tasks/components/TaskItem';
import { formatFullDate, todayKey } from '../../../features/tasks/dates';
import { useTasksForDay, useUpdateTaskStatus } from '../../../features/tasks/hooks';
import { countDone } from '../../../features/tasks/status';
import { toUserMessage } from '../../../lib/errors';
import { useAppTheme } from '../../../lib/theme';

export default function TodayScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;

  const [date, setDate] = useState(todayKey);
  const { data: tasks, isLoading, error, refetch, isRefetching } = useTasksForDay(groupId, date);
  const statusMutation = useUpdateTaskStatus(groupId);

  // Najpierw niezrobione, zrobione na końcu listy
  const myTasks = (tasks ?? [])
    .filter((task) => task.assigned_to === userId)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const done = countDone(myTasks);
  const isManager = canManageTasks(membership?.role);

  const name: string =
    membership?.label || session?.user.user_metadata?.display_name || 'Cześć';

  return (
    <View style={styles.container}>
      <FlatList
        data={myTasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ProgressHero
              title={`Cześć, ${name}! 👋`}
              subtitle={formatFullDate(date)}
              done={done}
              total={myTasks.length}
            />
            <DaySwitcher value={date} onChange={setDate} />
            {myTasks.length > 0 ? (
              <Text
                variant="labelLarge"
                style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
              >
                TWOJE ZADANIA
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.empty} color={theme.colors.primary} />
          ) : error ? (
            <Text style={[styles.empty, styles.emptyText]}>{toUserMessage(error)}</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌤️</Text>
              <Text variant="titleMedium">Brak zadań na ten dzień</Text>
              {isManager ? (
                <Text
                  variant="bodyMedium"
                  style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
                >
                  Dodaj zadanie przyciskiem „+”.
                </Text>
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
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
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
  list: { paddingHorizontal: 16, paddingBottom: 104 },
  header: { paddingTop: 8, paddingBottom: 12, gap: 16 },
  sectionTitle: { marginLeft: 4, letterSpacing: 0.8 },
  separator: { height: 10 },
  empty: { alignItems: 'center', gap: 6, marginTop: 40 },
  emptyEmoji: { fontSize: 48, lineHeight: 56 },
  emptyText: { textAlign: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 20, borderRadius: 20 },
});
