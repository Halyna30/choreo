import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { ProgressHero } from '../../../components/ProgressHero';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useMemberColor } from '../../../features/groups/colors';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks, getMemberName } from '../../../features/groups/roles';
import type { GroupMember } from '../../../features/groups/types';
import { memberLookup } from '../../../features/groups/useMemberLookup';
import { RewardChip } from '../../../features/points/components/RewardsBanner';
import { usePointBalances } from '../../../features/points/hooks';
import {
  canChangeTaskStatus,
  describeAssignees,
  taskBelongsTo,
} from '../../../features/tasks/assignees';
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

type MemberCardProps = {
  member: GroupMember;
  tasks: Task[];
  isMe: boolean;
  isManager: boolean;
  userId: string | undefined;
  stars: number;
  claps: number;
  subtitleOf: (task: Task) => string;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
  onOpenTask: (task: Task) => void;
};

function MemberCard({
  member,
  tasks,
  isMe,
  isManager,
  userId,
  stars,
  claps,
  subtitleOf,
  onChangeStatus,
  onOpenTask,
}: MemberCardProps) {
  const theme = useAppTheme();
  const color = useMemberColor(member.user_id);
  const name = getMemberName(member);
  const done = countDone(tasks);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={styles.cardHeader}>
        <MemberAvatar
          userId={member.user_id}
          name={name}
          avatarUrl={member.profile?.avatar_url}
          size={44}
        />
        <View style={styles.cardTitle}>
          <Text variant="titleMedium">{isMe ? `${name} (Ty)` : name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {tasks.length > 0
              ? done === tasks.length
                ? 'Wszystko zrobione 🌟'
                : `Zrobione: ${done} z ${tasks.length}`
              : 'Brak zadań na ten dzień'}
          </Text>
        </View>
        <RewardChip isChild={member.role === 'child'} stars={stars} claps={claps} />
      </View>

      {tasks.length > 0 ? (
        <>
          <ProgressBar
            progress={done / tasks.length}
            color={color.accent}
            style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          <View style={styles.tasks}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                subtitle={subtitleOf(task)}
                isManager={isManager}
                canChangeStatus={canChangeTaskStatus(task, userId, isManager)}
                onChangeStatus={(status) => onChangeStatus(task, status)}
                onPress={() => onOpenTask(task)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function GroupScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const isManager = canManageTasks(membership?.role);

  const [date, setDate] = useState(todayKey);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId);
  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch,
    isRefetching,
  } = useTasksForDay(groupId, date);
  const { data: pending } = usePendingTasks(groupId, isManager);
  const { data: balances } = usePointBalances(groupId);
  const statusMutation = useUpdateTaskStatus(groupId, isManager);
  const lookup = memberLookup(members);

  const isLoading = membersLoading || tasksLoading;
  const allTasks = tasks ?? [];
  const selectedTask =
    [...allTasks, ...(pending ?? [])].find((task) => task.id === selectedTaskId) ?? null;
  // Dziecko widzi tylko karty dzieci (zadań dorosłych i tak nie dostaje z bazy)
  const visibleMembers = isManager
    ? members
    : members?.filter((member) => member.role === 'child');

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
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <ProgressHero
          title={membership?.group.name ?? 'Grupa'}
          subtitle={formatFullDate(date)}
          done={countDone(allTasks)}
          total={allTasks.length}
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

        {isLoading ? <ActivityIndicator style={styles.loader} color={theme.colors.primary} /> : null}

        {visibleMembers?.map((member) => {
          const balance = balances?.get(member.user_id);
          return (
            <MemberCard
              key={member.user_id}
              member={member}
              // zadania wspólne pokazujemy u każdego uczestnika
              tasks={allTasks
                .filter((task) => taskBelongsTo(task, member.user_id))
                .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))}
              isMe={member.user_id === userId}
              isManager={isManager}
              userId={userId}
              stars={balance?.stars ?? 0}
              claps={balance?.claps ?? 0}
              subtitleOf={subtitleOf}
              onChangeStatus={changeStatus}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
            />
          );
        })}
      </ScrollView>

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
  flex: { flex: 1 },
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  loader: { marginTop: 32 },
  card: { borderRadius: 24, borderWidth: 1, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { flex: 1, gap: 2 },
  progress: { height: 8, borderRadius: 4 },
  tasks: { gap: 8 },
});
