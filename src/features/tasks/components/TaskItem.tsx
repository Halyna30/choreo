import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../../../lib/theme';
import { STATUS_META, nextStatus } from '../status';
import type { Task, TaskStatus } from '../types';

type Props = {
  task: Task;
  subtitle?: string;
  isManager: boolean;
  canChangeStatus: boolean;
  onChangeStatus: (status: TaskStatus) => void;
  onPress: () => void;
};

export function TaskItem({
  task,
  subtitle,
  isManager,
  canChangeStatus,
  onChangeStatus,
  onPress,
}: Props) {
  const theme = useAppTheme();
  const meta = STATUS_META[task.status];
  const isDone = task.status === 'done';
  const next = nextStatus(task.status, isManager);

  // Wygląd przycisku statusu: puste kółko -> zegar -> klepsydra -> zielony ptaszek
  const check = {
    todo: { bg: 'transparent', border: theme.colors.outline, icon: 'transparent', name: 'check' },
    in_progress: {
      bg: theme.colors.tertiaryContainer,
      border: theme.colors.tertiary,
      icon: theme.colors.onTertiaryContainer,
      name: 'progress-clock',
    },
    pending: {
      bg: theme.colors.secondaryContainer,
      border: theme.colors.secondary,
      icon: theme.colors.onSecondaryContainer,
      name: 'timer-sand',
    },
    done: {
      bg: theme.colors.success,
      border: theme.colors.success,
      icon: theme.colors.onSuccess,
      name: 'check-bold',
    },
  }[task.status];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDone ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor:
            task.status === 'pending' ? theme.colors.secondary : theme.colors.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => onChangeStatus(next)}
        disabled={!canChangeStatus}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${meta.label}. Zmień na: ${STATUS_META[next].label}`}
        style={[
          styles.check,
          { backgroundColor: check.bg, borderColor: check.border },
          !canChangeStatus && task.status !== 'done' && task.status !== 'pending' && styles.disabled,
        ]}
      >
        <Icon source={check.name} size={18} color={check.icon} />
      </Pressable>

      <View style={styles.body}>
        <Text
          variant="titleMedium"
          numberOfLines={2}
          style={[
            isDone && styles.doneTitle,
            { color: isDone ? theme.colors.onSurfaceVariant : theme.colors.onSurface },
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.meta}>
          {task.template_id ? (
            <Icon source="repeat" size={14} color={theme.colors.onSurfaceVariant} />
          ) : null}
          {task.assignment !== 'single' ? (
            <Icon
              source={task.assignment === 'together' ? 'account-group' : 'account-question'}
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          ) : null}
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.flex, { color: theme.colors.onSurfaceVariant }]}
          >
            {subtitle ?? meta.label}
          </Text>
        </View>
      </View>

      <Icon source="chevron-right" size={22} color={theme.colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
  doneTitle: { textDecorationLine: 'line-through' },
});
