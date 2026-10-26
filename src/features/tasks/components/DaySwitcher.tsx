import { StyleSheet, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { addDays, formatDayLabel, todayKey } from '../dates';

type Props = {
  value: string;
  onChange: (date: string) => void;
};

export function DaySwitcher({ value, onChange }: Props) {
  const isToday = value === todayKey();

  return (
    <View style={styles.row}>
      <IconButton
        icon="chevron-left"
        accessibilityLabel="Poprzedni dzień"
        onPress={() => onChange(addDays(value, -1))}
      />
      <Button
        mode={isToday ? 'contained-tonal' : 'text'}
        onPress={() => onChange(todayKey())}
        accessibilityHint="Wróć do dzisiejszego dnia"
        style={styles.label}
      >
        {formatDayLabel(value)}
      </Button>
      <IconButton
        icon="chevron-right"
        accessibilityLabel="Następny dzień"
        onPress={() => onChange(addDays(value, 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { minWidth: 140 },
});
