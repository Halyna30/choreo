import { StyleSheet } from 'react-native';
import { IconButton, List, useTheme } from 'react-native-paper';
import { NEXT_STATUS, STATUS_META } from '../status';
import type { Task, TaskStatus } from '../types';

type Props = {
  task: Task;
  subtitle?: string;
  canChangeStatus: boolean;
  onChangeStatus: (status: TaskStatus) => void;
  onPress: () => void;
};

export function TaskItem({ task, subtitle, canChangeStatus, onChangeStatus, onPress }: Props) {
  const theme = useTheme();
  const meta = STATUS_META[task.status];
  const isDone = task.status === 'done';

  const iconColor =
    task.status === 'done'
      ? theme.colors.primary
      : task.status === 'in_progress'
        ? theme.colors.secondary
        : theme.colors.onSurfaceVariant;

  const description = `${task.template_id ? '🔁 ' : ''}${subtitle ?? meta.label}`;

  return (
    <List.Item
      title={task.title}
      description={description}
      onPress={onPress}
      titleStyle={isDone ? [styles.doneTitle, { color: theme.colors.onSurfaceVariant }] : undefined}
      titleNumberOfLines={2}
      left={() => (
        <IconButton
          icon={meta.icon}
          iconColor={iconColor}
          size={28}
          disabled={!canChangeStatus}
          accessibilityLabel={`Status: ${meta.label}. Zmień na: ${STATUS_META[NEXT_STATUS[task.status]].label}`}
          onPress={() => onChangeStatus(NEXT_STATUS[task.status])}
        />
      )}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
    />
  );
}

const styles = StyleSheet.create({
  doneTitle: { textDecorationLine: 'line-through' },
});
