import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { useAppTheme } from '../../../lib/theme';
import { getMemberName } from '../../groups/roles';
import type { GroupMember } from '../../groups/types';
import { formatDayLabel } from '../dates';
import type { Task } from '../types';

type Props = {
  tasks: Task[];
  members: GroupMember[] | undefined;
  onApprove: (task: Task) => void;
  onOpen: (task: Task) => void;
};

// Karta dla rodzica: zadania dzieci czekające na zatwierdzenie (ze wszystkich dni)
export function ApprovalsCard({ tasks, members, onApprove, onOpen }: Props) {
  const theme = useAppTheme();
  if (tasks.length === 0) return null;

  function memberOf(task: Task) {
    const id = task.completed_by ?? task.assigned_to;
    return members?.find((member) => member.user_id === id);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.secondary },
      ]}
    >
      <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
        ⏳ Do zatwierdzenia: {tasks.length}
      </Text>
      {tasks.map((task) => {
        const member = memberOf(task);
        const name = member ? getMemberName(member) : 'Dziecko';
        return (
          <View key={task.id} style={[styles.row, { backgroundColor: theme.colors.surface }]}>
            <MemberAvatar
              userId={member?.user_id}
              name={name}
              avatarUrl={member?.profile?.avatar_url}
              size={36}
            />
            <View style={styles.flex}>
              <Text variant="titleSmall" numberOfLines={1} onPress={() => onOpen(task)}>
                {task.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {name} · {formatDayLabel(task.due_date)}
              </Text>
            </View>
            <Button
              mode="contained"
              compact
              icon="check"
              buttonColor={theme.colors.success}
              textColor={theme.colors.onSuccess}
              onPress={() => onApprove(task)}
            >
              OK
            </Button>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16 },
  flex: { flex: 1 },
});
