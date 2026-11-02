import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { KeyboardScrollView } from '../../../components/KeyboardScrollView';
import { Button, Card, Divider, HelperText, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { memberLookup } from '../../../features/groups/useMemberLookup';
import { assigneeIdsOf, describeAssignees } from '../../../features/tasks/assignees';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import { formatFullDate } from '../../../features/tasks/dates';
import { useDeleteTask, useSaveTask, useTask, useTemplate } from '../../../features/tasks/hooks';
import { statusLabel } from '../../../features/tasks/status';
import { describeWeekdays } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

// Pełna edycja zadania (dla zarządcy i dorosłych). Status i komentarze są w okienku zadania.
export default function TaskDetailScreen() {
  const { t } = useTranslation();
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
        <Text variant="bodyLarge">{t('task.notFound')}</Text>
      </View>
    );
  }

  const isManager = canManageTasks(membership?.role);
  const lookup = memberLookup(members, t);
  const isRecurring = Boolean(task.template_id);
  const error = saveTask.error ?? deleteTask.error;

  return (
    <KeyboardScrollView contentContainerStyle={styles.container}>
      <Text variant="bodyMedium">
        {t('task.statusLine', {
          status: statusLabel(task.status, t),
          assignees: describeAssignees(task, lookup.nameOf, t),
        })}
      </Text>

      {isRecurring ? (
        <Card mode="contained">
          <Card.Content style={styles.recurring}>
            <Text variant="titleSmall">
              {template
                ? t('task.recurringWithDays', { days: describeWeekdays(template.weekdays, t) })
                : t('task.recurring')}
            </Text>
            {isManager ? <Text variant="bodySmall">{t('task.recurringHint')}</Text> : null}
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
                {t('task.editRepeat')}
              </Button>
            </Card.Actions>
          ) : null}
        </Card>
      ) : null}

      <HelperText type="error" visible={Boolean(error)}>
        {error ? toUserMessage(error, t) : null}
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
          submitLabel={t('common.saveChanges')}
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
          <Text variant="bodyMedium">
            {t('task.when', { date: formatFullDate(task.due_date, t) })}
          </Text>
        </View>
      )}

      {isManager ? (
        <>
          <Divider style={styles.divider} />
          <Button mode="outlined" icon="delete-outline" onPress={() => setConfirmVisible(true)}>
            {isRecurring ? t('task.deleteFromDay') : t('task.delete')}
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title={isRecurring ? t('task.confirmDeleteFromDay') : t('task.confirmDelete')}
        message={
          isRecurring
            ? t('task.deleteFromDayMessage', {
                title: task.title,
                date: formatFullDate(task.due_date, t),
              })
            : t('task.deleteMessage', { title: task.title })
        }
        confirmLabel={t('common.delete')}
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
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  details: { gap: 8 },
  recurring: { gap: 4 },
  divider: { marginVertical: 8 },
  loader: { marginTop: 32 },
});
