import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import { todayKey } from '../../../features/tasks/dates';
import { useCreateTask } from '../../../features/tasks/hooks';
import { toUserMessage } from '../../../lib/errors';

export default function NewTaskScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const { data: members, isLoading } = useGroupMembers(groupId);
  const createTask = useCreateTask(groupId);

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

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TaskForm
        initialValues={{
          title: '',
          description: '',
          // jeśli w grupie jest tylko jedna osoba, wybieramy ją od razu
          assignedTo: members.length === 1 ? members[0].user_id : '',
          dueDate: date ?? todayKey(),
        }}
        members={members}
        submitLabel="Dodaj zadanie"
        loading={createTask.isPending}
        serverError={createTask.error ? toUserMessage(createTask.error) : null}
        onSubmit={(values) =>
          createTask.mutate(
            {
              groupId,
              title: values.title,
              description: values.description,
              assignedTo: values.assignedTo,
              dueDate: values.dueDate,
            },
            { onSuccess: () => router.back() },
          )
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loader: { marginTop: 32 },
});
