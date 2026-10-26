import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { canManageTasks } from '../../../features/groups/roles';
import { TaskForm } from '../../../features/tasks/components/TaskForm';
import {
  useDeleteTemplate,
  useTemplate,
  useUpdateTemplate,
} from '../../../features/tasks/hooks';
import { repeatModeFromWeekdays, weekdaysFromForm } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

export default function TemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;

  const { data: template, isLoading } = useTemplate(id);
  const { data: members } = useGroupMembers(groupId);
  const updateTemplate = useUpdateTemplate(groupId);
  const deleteTemplate = useDeleteTemplate(groupId);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!template || !members) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">To powtarzanie nie istnieje albo zostało usunięte.</Text>
      </View>
    );
  }

  if (!canManageTasks(membership?.role)) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">Tylko zarządca i dorośli mogą zmieniać powtarzanie.</Text>
      </View>
    );
  }

  const error = updateTemplate.error ?? deleteTemplate.error;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!template.is_active ? (
        <HelperText type="info">
          ⏸ Powtarzanie jest wstrzymane – nowe zadania się nie tworzą.
        </HelperText>
      ) : null}

      <TaskForm
        key={`${template.id}-${template.created_at}`}
        initialValues={{
          title: template.title,
          description: template.description ?? '',
          assignedTo: template.assigned_to,
          dueDate: template.start_date,
          repeat: repeatModeFromWeekdays(template.weekdays),
          weekdays: template.weekdays,
        }}
        members={members}
        repeatMode="required"
        submitLabel="Zapisz powtarzanie"
        loading={updateTemplate.isPending}
        serverError={error ? toUserMessage(error) : null}
        onSubmit={(values) =>
          updateTemplate.mutate(
            {
              id: template.id,
              title: values.title,
              description: values.description,
              assignedTo: values.assignedTo,
              weekdays: weekdaysFromForm(values),
              startDate: values.dueDate,
            },
            { onSuccess: () => router.back() },
          )
        }
      />

      <HelperText type="info">
        Zmiany obejmą przyszłe zadania, których nikt jeszcze nie zaczął. Zrobione zadania zostają w
        historii.
      </HelperText>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon={template.is_active ? 'pause' : 'play'}
        loading={updateTemplate.isPending}
        disabled={updateTemplate.isPending}
        onPress={() => updateTemplate.mutate({ id: template.id, isActive: !template.is_active })}
      >
        {template.is_active ? 'Wstrzymaj powtarzanie' : 'Wznów powtarzanie'}
      </Button>

      <Button mode="text" icon="delete-outline" onPress={() => setConfirmVisible(true)}>
        Usuń powtarzanie
      </Button>

      <ConfirmDialog
        visible={confirmVisible}
        title="Usunąć powtarzanie?"
        message={`Przyszłe zadania „${template.title}” znikną. Zadania z przeszłości i już rozpoczęte zostaną.`}
        confirmLabel="Usuń"
        destructive
        loading={deleteTemplate.isPending}
        onConfirm={() =>
          deleteTemplate.mutate(template.id, {
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
  divider: { marginVertical: 8 },
  loader: { marginTop: 32 },
});
