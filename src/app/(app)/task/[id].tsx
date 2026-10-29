import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, HelperText, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { memberLookup } from '../../../features/groups/useMemberLookup';
import { assigneeIdsOf, describeAssignees } from '../../../features/tasks/assignees';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import { formatFullDate } from '../../../features/tasks/dates';
import { useDeleteTask, useSaveTask, useTask, useTemplate } from '../../../features/tasks/hooks';
import { STATUS_META } from '../../../features/tasks/status';
import { describeWeekdays } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

// Pełna edycja zadania (dla zarządcy i dorosłych). Status i komentarze są w okienku zadania.
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;

  const { data: task, isLoading } = useTask(id);
  const { data: template } = useTemplate(task?.template_id);
  const { data: members } = useGroupMembers(groupId);
  const saveTask = useSaveTask(groupId);
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
  const lookup = memberLookup(members);
  const isRecurring = Boolean(task.template_id);
  const error = saveTask.error ?? deleteTask.error;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="bodyMedium">
        Status: {STATUS_META[task.status].label} · {describeAssignees(task, lookup.nameOf)}
      </Text>

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

      <HelperText type="error" visible={Boolean(error)}>
        {error ? toUserMessage(error) : null}
      </HelperText>

      {isManager && members ? (
        <TaskForm
          // key resetuje formularz, gdy zadanie zmieni się na serwerze
          key={`${task.id}-${task.title}-${task.assignment}-${assigneeIdsOf(task).join()}-${task.due_date}`}
          initialValues={{
            title: task.title,
            description: task.description ?? '',
            assigneeIds: assigneeIdsOf(task),
            assignment: task.assignment,
            dueDate: task.due_date,
            repeat: 'none',
            weekdays: [],
          }}
          members={members}
          repeatMode="hidden"
          submitLabel="Zapisz zmiany"
          loading={saveTask.isPending}
          onSubmit={(values) =>
            saveTask.mutate(
              {
                groupId,
                taskId: task.id,
                title: values.title,
                description: values.description,
                dueDate: values.dueDate,
                assignment: values.assignment,
                assigneeIds: values.assigneeIds,
              },
              { onSuccess: () => router.back() },
            )
          }
        />
      ) : (
        <View style={styles.details}>
          <Text variant="headlineSmall">{task.title}</Text>
          {task.description ? <Text variant="bodyLarge">{task.description}</Text> : null}
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
            : `Zadanie „${task.title}” zostanie usunięte na stałe. Zdobyte za nie gwiazdki zostaną.`
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
