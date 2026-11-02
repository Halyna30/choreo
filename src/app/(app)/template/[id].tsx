import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { KeyboardScrollView } from '../../../components/KeyboardScrollView';
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
import { assigneeIdsOf } from '../../../features/tasks/assignees';
import { repeatModeFromWeekdays, weekdaysFromForm } from '../../../features/tasks/weekdays';
import { toUserMessage } from '../../../lib/errors';

export default function TemplateScreen() {
  const { t } = useTranslation();
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
        <Text variant="bodyLarge">{t('templates.notFound')}</Text>
      </View>
    );
  }

  if (!canManageTasks(membership?.role)) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">{t('templates.managersOnly')}</Text>
      </View>
    );
  }

  const error = updateTemplate.error ?? deleteTemplate.error;

  return (
    <KeyboardScrollView contentContainerStyle={styles.container}>
      {!template.is_active ? (
        <HelperText type="info">{t('templates.pausedInfo')}</HelperText>
      ) : null}

      <TaskForm
        key={`${template.id}-${template.created_at}`}
        initialValues={{
          title: template.title,
          description: template.description ?? '',
          assigneeIds: assigneeIdsOf(template),
          assignment: template.assignment,
          dueDate: template.start_date,
          repeat: repeatModeFromWeekdays(template.weekdays),
          weekdays: template.weekdays,
        }}
        members={members}
        repeatMode="required"
        submitLabel={t('templates.save')}
        loading={updateTemplate.isPending}
        serverError={error ? toUserMessage(error, t) : null}
        onSubmit={(values) =>
          updateTemplate.mutate(
            {
              id: template.id,
              title: values.title,
              description: values.description,
              assignment: values.assignment,
              assigneeIds: values.assigneeIds,
              weekdays: weekdaysFromForm(values),
              startDate: values.dueDate,
            },
            { onSuccess: () => router.back() },
          )
        }
      />

      <HelperText type="info">{t('templates.changesHint')}</HelperText>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon={template.is_active ? 'pause' : 'play'}
        loading={updateTemplate.isPending}
        disabled={updateTemplate.isPending}
        onPress={() => updateTemplate.mutate({ id: template.id, isActive: !template.is_active })}
      >
        {template.is_active ? t('templates.pause') : t('templates.resume')}
      </Button>

      <Button mode="text" icon="delete-outline" onPress={() => setConfirmVisible(true)}>
        {t('templates.delete')}
      </Button>

      <ConfirmDialog
        visible={confirmVisible}
        title={t('templates.confirmDelete')}
        message={t('templates.deleteMessage', { title: template.title })}
        confirmLabel={t('common.delete')}
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
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  divider: { marginVertical: 8 },
  loader: { marginTop: 32 },
});
