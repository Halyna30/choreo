import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Card, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks, getMemberName } from '../../../features/groups/roles';
import { DaySwitcher } from '../../../features/tasks/components/DaySwitcher';
import { TaskItem } from '../../../features/tasks/components/TaskItem';
import { todayKey } from '../../../features/tasks/dates';
import { useTasksForDay, useUpdateTaskStatus } from '../../../features/tasks/hooks';
import { STATUS_META, countDone } from '../../../features/tasks/status';
import { toUserMessage } from '../../../lib/errors';

export default function GroupScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const isManager = canManageTasks(membership?.role);

  const [date, setDate] = useState(todayKey);
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId);
  const { data: tasks, isLoading: tasksLoading, refetch, isRefetching } = useTasksForDay(
    groupId,
    date,
  );
  const statusMutation = useUpdateTaskStatus(groupId);

  const isLoading = membersLoading || tasksLoading;
  const allTasks = tasks ?? [];

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <DaySwitcher value={date} onChange={setDate} />

        {allTasks.length > 0 ? (
          <Text variant="bodyMedium" style={styles.total}>
            Cała grupa: {countDone(allTasks)} z {allTasks.length} zadań zrobionych
          </Text>
        ) : null}

        {isLoading ? <ActivityIndicator style={styles.loader} /> : null}

        {members?.map((member) => {
          const memberTasks = allTasks.filter((task) => task.assigned_to === member.user_id);
          const done = countDone(memberTasks);
          const name = getMemberName(member);
          const isMe = member.user_id === userId;

          return (
            <Card key={member.user_id} mode="outlined" style={styles.card}>
              <Card.Title
                title={isMe ? `${name} (Ty)` : name}
                subtitle={
                  memberTasks.length > 0
                    ? `Zrobione: ${done} z ${memberTasks.length}`
                    : 'Brak zadań na ten dzień'
                }
                left={(props) => (
                  <Avatar.Text {...props} label={name.charAt(0).toUpperCase()} />
                )}
              />
              {memberTasks.length > 0 ? (
                <Card.Content style={styles.cardContent}>
                  <ProgressBar
                    progress={done / memberTasks.length}
                    style={styles.progress}
                  />
                  {memberTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      subtitle={STATUS_META[task.status].label}
                      canChangeStatus={isManager || task.assigned_to === userId}
                      onChangeStatus={(status) => statusMutation.mutate({ id: task.id, status })}
                      onPress={() =>
                        router.push({ pathname: '/task/[id]', params: { id: task.id } })
                      }
                    />
                  ))}
                </Card.Content>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>

      <Snackbar visible={Boolean(statusMutation.error)} onDismiss={() => statusMutation.reset()}>
        {statusMutation.error ? toUserMessage(statusMutation.error) : ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 12, gap: 12 },
  total: { textAlign: 'center' },
  loader: { marginTop: 32 },
  card: { overflow: 'hidden' },
  cardContent: { paddingHorizontal: 0, gap: 4 },
  progress: { height: 6, borderRadius: 3, marginHorizontal: 16, marginBottom: 4 },
});
