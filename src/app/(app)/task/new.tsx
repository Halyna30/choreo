import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import { todayKey } from '../../../features/tasks/dates';
import { useCreateTask, useCreateTemplate } from '../../../features/tasks/hooks';
import type { TaskFormValues } from '../../../features/tasks/types';
import { isoWeekday, weekdaysFromForm } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

export default function NewTaskScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const { data: members, isLoading } = useGroupMembers(groupId);
  const createTask = useCreateTask(groupId);
  const createTemplate = useCreateTemplate(groupId);

  if (!canManageTasks(membership?.role)) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyLarge">Tylko zarządca i dorośli mogą dodawać zadania.</Text>
      </ScrollView>
    );
  }

  if (isLoading || !members || !groupId) {
    return <ActivityIndicator style={styles.loader} />;
  }

  const startDate = date ?? todayKey();
  const error = createTask.error ?? createTemplate.error;

  function handleSubmit(values: TaskFormValues) {
    if (!groupId) return;
    const onSuccess = () => router.back();

    if (values.repeat === 'none') {
      createTask.mutate(
        {
          groupId,
          title: values.title,
          description: values.description,
          assignedTo: values.assignedTo,
          dueDate: values.dueDate,
        },
        { onSuccess },
      );
    } else {
      // Zadanie cykliczne: zapisujemy szablon, a zadania na dni utworzy baza
      createTemplate.mutate(
        {
          groupId,
          title: values.title,
          description: values.description,
          assignedTo: values.assignedTo,
          weekdays: weekdaysFromForm(values),
          startDate: values.dueDate,
        },
        { onSuccess },
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TaskForm
        initialValues={{
          title: '',
          description: '',
          // jeśli w grupie jest tylko jedna osoba, wybieramy ją od razu
          assignedTo: members.length === 1 ? members[0].user_id : '',
          dueDate: startDate,
          repeat: 'none',
          weekdays: [isoWeekday(startDate)],
        }}
        members={members}
        repeatMode="optional"
        submitLabel="Dodaj zadanie"
        loading={createTask.isPending || createTemplate.isPending}
        serverError={error ? toUserMessage(error) : null}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loader: { marginTop: 32 },
});
