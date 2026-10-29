import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Snackbar, Text } from 'react-native-paper';
import { ProgressHero } from '../../../components/ProgressHero';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { memberLookup } from '../../../features/groups/useMemberLookup';
import { canChangeTaskStatus, describeAssignees, taskBelongsTo } from '../../../features/tasks/assignees';
import { ApprovalsCard } from '../../../features/tasks/components/ApprovalsCard';
import { DaySwitcher } from '../../../features/tasks/components/DaySwitcher';
import { TaskItem } from '../../../features/tasks/components/TaskItem';
import { TaskSheet } from '../../../features/tasks/components/TaskSheet';
import { formatFullDate, todayKey } from '../../../features/tasks/dates';
import { statusFeedback } from '../../../features/tasks/feedback';
import {
  usePendingTasks,
  useTasksForDay,
  useUpdateTaskStatus,
} from '../../../features/tasks/hooks';
import { STATUS_META, countDone } from '../../../features/tasks/status';
import type { Task, TaskStatus } from '../../../features/tasks/types';
import { toUserMessage } from '../../../lib/errors';
import { useAppTheme } from '../../../lib/theme';

export default function TodayScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const isManager = canManageTasks(membership?.role);

  const [date, setDate] = useState(todayKey);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: members } = useGroupMembers(groupId);
  const { data: tasks, isLoading, error, refetch, isRefetching } = useTasksForDay(groupId, date);
  const { data: pending } = usePendingTasks(groupId, isManager);
  const statusMutation = useUpdateTaskStatus(groupId, isManager);
  const lookup = memberLookup(members);

  // Najpierw niezrobione, zrobione na końcu listy
  const myTasks = (tasks ?? [])
    .filter((task) => taskBelongsTo(task, userId))
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const done = countDone(myTasks);

  const allKnown = [...(tasks ?? []), ...(pending ?? [])];
  const selectedTask = allKnown.find((task) => task.id === selectedTaskId) ?? null;

  const name: string =
    membership?.label || session?.user.user_metadata?.display_name || 'Cześć';

  function changeStatus(task: Task, status: TaskStatus) {
    statusMutation.mutate(
      { id: task.id, status },
      {
        onSuccess: () =>
          setMessage(
            statusFeedback({
              task,
              status,
              isManager,
              userId,
              nameOf: lookup.nameOf,
              isChild: lookup.isChild,
            }),
          ),
      },
    );
  }

  function subtitleOf(task: Task) {
    const status = STATUS_META[task.status].label;
    return task.assignment === 'single' ? status : `${status} · ${describeAssignees(task, lookup.nameOf)}`;
  }

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
            {isManager ? (
              <ApprovalsCard
                tasks={pending ?? []}
                members={members}
                onApprove={(task) => changeStatus(task, 'done')}
                onOpen={(task) => setSelectedTaskId(task.id)}
              />
            ) : null}
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
            subtitle={subtitleOf(item)}
            isManager={isManager}
            canChangeStatus={canChangeTaskStatus(item, userId, isManager)}
            onChangeStatus={(status) => changeStatus(item, status)}
            onPress={() => setSelectedTaskId(item.id)}
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

      <TaskSheet
        task={selectedTask}
        members={members}
        isManager={isManager}
        onChangeStatus={changeStatus}
        onDismiss={() => setSelectedTaskId(null)}
      />

      <Snackbar
        visible={Boolean(statusMutation.error) || Boolean(message)}
        onDismiss={() => {
          statusMutation.reset();
          setMessage(null);
        }}
        duration={2500}
      >
        {statusMutation.error ? toUserMessage(statusMutation.error) : (message ?? '')}
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
