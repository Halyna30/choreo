import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../../../lib/theme';
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
  const theme = useAppTheme();
  const meta = STATUS_META[task.status];
  const isDone = task.status === 'done';
  const inProgress = task.status === 'in_progress';

  // Wygląd przycisku statusu: puste kółko -> zegar -> zielony ptaszek
  const checkStyle = isDone
    ? { backgroundColor: theme.colors.success, borderColor: theme.colors.success }
    : inProgress
      ? { backgroundColor: theme.colors.tertiaryContainer, borderColor: theme.colors.tertiary }
      : { backgroundColor: 'transparent', borderColor: theme.colors.outline };

  const iconColor = isDone
    ? theme.colors.onSecondary
    : inProgress
      ? theme.colors.onTertiaryContainer
      : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      // Na webie role="button" renderuje <button>, a zagnieżdżony <button> jest niedozwolony
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDone ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => onChangeStatus(NEXT_STATUS[task.status])}
        disabled={!canChangeStatus}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${meta.label}. Zmień na: ${STATUS_META[NEXT_STATUS[task.status]].label}`}
        style={[styles.check, checkStyle, !canChangeStatus && styles.disabled]}
      >
        <Icon source={isDone ? 'check-bold' : 'progress-clock'} size={18} color={iconColor} />
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
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
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
  doneTitle: { textDecorationLine: 'line-through' },
});
