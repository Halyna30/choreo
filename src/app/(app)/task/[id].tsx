import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, HelperText, SegmentedButtons, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks, getMemberName } from '../../../features/groups/roles';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import { formatFullDate } from '../../../features/tasks/dates';
import {
  useDeleteTask,
  useTask,
  useTemplate,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../../../features/tasks/hooks';
import { STATUS_META } from '../../../features/tasks/status';
import type { TaskStatus } from '../../../features/tasks/types';
import { describeWeekdays } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;

  const { data: task, isLoading } = useTask(id);
  const { data: template } = useTemplate(task?.template_id);
  const { data: members } = useGroupMembers(groupId);
  const updateStatus = useUpdateTaskStatus(groupId);
  const updateTask = useUpdateTask(groupId);
  const deleteTask = useDeleteTask(groupId);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!task || !groupId) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">To zadanie nie istnieje albo zostało usunięte.</Text>
      </View>
    );
  }

  const isManager = canManageTasks(membership?.role);
  const canChangeStatus = isManager || task.assigned_to === session?.user.id;
  const assignee = members?.find((member) => member.user_id === task.assigned_to);
  const isRecurring = Boolean(task.template_id);
  const error = updateStatus.error ?? updateTask.error ?? deleteTask.error;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="labelLarge">Status</Text>
      <SegmentedButtons
        value={task.status}
        onValueChange={(value) => updateStatus.mutate({ id: task.id, status: value as TaskStatus })}
        buttons={STATUSES.map((status) => ({
          value: status,
          label: STATUS_META[status].label,
          icon: STATUS_META[status].icon,
          disabled: !canChangeStatus,
        }))}
      />

      <HelperText type="error" visible={Boolean(error)}>
        {error ? toUserMessage(error) : null}
      </HelperText>

      {isRecurring ? (
        <Card mode="contained">
          <Card.Content style={styles.recurring}>
            <Text variant="titleSmall">
              🔁 Zadanie cykliczne{template ? `: ${describeWeekdays(template.weekdays)}` : ''}
            </Text>
            {isManager ? (
              <Text variant="bodySmall">
                Zmiany poniżej dotyczą tylko tego dnia. Aby zmienić wszystkie kolejne dni, edytuj
                powtarzanie.
              </Text>
            ) : null}
          </Card.Content>
          {isManager && task.template_id ? (
            <Card.Actions>
              <Button
                icon="repeat"
                onPress={() =>
                  router.push({
                    pathname: '/template/[id]',
                    params: { id: task.template_id as string },
                  })
                }
              >
                Edytuj powtarzanie
              </Button>
            </Card.Actions>
          ) : null}
        </Card>
      ) : null}

      <Divider />

      {isManager && members ? (
        <TaskForm
          // key resetuje formularz, gdy zadanie zmieni się na serwerze
          key={`${task.id}-${task.title}-${task.assigned_to}-${task.due_date}`}
          initialValues={{
            title: task.title,
            description: task.description ?? '',
            assignedTo: task.assigned_to,
            dueDate: task.due_date,
            repeat: 'none',
            weekdays: [],
          }}
          members={members}
          repeatMode="hidden"
          submitLabel="Zapisz zmiany"
          loading={updateTask.isPending}
          onSubmit={(values) =>
            updateTask.mutate(
              {
                id: task.id,
                title: values.title,
                description: values.description,
                assignedTo: values.assignedTo,
                dueDate: values.dueDate,
              },
              { onSuccess: () => router.back() },
            )
          }
        />
      ) : (
        <View style={styles.details}>
          <Text variant="headlineSmall">{task.title}</Text>
          {task.description ? <Text variant="bodyLarge">{task.description}</Text> : null}
          <Text variant="bodyMedium">Dla: {assignee ? getMemberName(assignee) : '—'}</Text>
          <Text variant="bodyMedium">Kiedy: {formatFullDate(task.due_date)}</Text>
        </View>
      )}

      {isManager ? (
        <>
          <Divider style={styles.divider} />
          <Button mode="outlined" icon="delete-outline" onPress={() => setConfirmVisible(true)}>
            {isRecurring ? 'Usuń z tego dnia' : 'Usuń zadanie'}
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title={isRecurring ? 'Usunąć zadanie z tego dnia?' : 'Usunąć zadanie?'}
        message={
          isRecurring
            ? `„${task.title}” zniknie tylko z ${formatFullDate(task.due_date)}. Pozostałe dni serii zostaną bez zmian.`
            : `Zadanie „${task.title}” zostanie usunięte na stałe.`
        }
        confirmLabel="Usuń"
        destructive
        loading={deleteTask.isPending}
        onConfirm={() =>
          deleteTask.mutate(task.id, {
            onSuccess: () => {
              setConfirmVisible(false);
              router.back();
            },
          })
        }
        onDismiss={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  details: { gap: 8 },
  recurring: { gap: 4 },
  divider: { marginVertical: 8 },
  loader: { marginTop: 32 },
});
