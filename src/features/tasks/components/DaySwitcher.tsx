import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../../../lib/theme';
import { addDays, formatDayLabel, todayKey } from '../dates';

type Props = {
  value: string;
  onChange: (date: string) => void;
};

export function DaySwitcher({ value, onChange }: Props) {
  const theme = useAppTheme();
  const isToday = value === todayKey();

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
    >
      <IconButton
        icon="chevron-left"
        size={22}
        accessibilityLabel="Poprzedni dzień"
        onPress={() => onChange(addDays(value, -1))}
      />
      <Pressable
        onPress={() => onChange(todayKey())}
        accessibilityRole="button"
        accessibilityHint="Wróć do dzisiejszego dnia"
        style={[
          styles.label,
          { backgroundColor: isToday ? theme.colors.primaryContainer : 'transparent' },
        ]}
      >
        <Text
          variant="titleMedium"
          style={{ color: isToday ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}
        >
          {formatDayLabel(value)}
        </Text>
      </Pressable>
      <IconButton
        icon="chevron-right"
        size={22}
        accessibilityLabel="Następny dzień"
        onPress={() => onChange(addDays(value, 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  label: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
  },
});
