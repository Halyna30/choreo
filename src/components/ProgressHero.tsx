import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { plural } from '../lib/plural';
import { useAppTheme } from '../lib/theme';

type Props = {
  title: string;
  subtitle: string;
  done: number;
  total: number;
};

function motivation(done: number, total: number): string {
  if (total === 0) return 'Wolny dzień – brak zadań 🎉';
  if (done === total) return 'Wszystko zrobione, brawo! 🌟';
  const left = total - done;
  if (done === 0) return `Do zrobienia: ${left} ${plural(left, 'zadanie', 'zadania', 'zadań')} 💪`;
  return `Jeszcze ${left} ${plural(left, 'zadanie', 'zadania', 'zadań')} – dasz radę! 💪`;
}

// Kolorowa karta z powitaniem i postępem dnia
export function ProgressHero({ title, subtitle, done, total }: Props) {
  const theme = useAppTheme();
  const color = theme.colors.onPrimaryContainer;

  return (
    <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
      <Text variant="headlineSmall" style={{ color }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color }]}>
        {subtitle}
      </Text>

      {total > 0 ? (
        <View style={styles.progressRow}>
          <View style={styles.flex}>
            <ProgressBar
              progress={done / total}
              color={theme.colors.primary}
              style={[styles.progress, { backgroundColor: theme.colors.surface }]}
            />
          </View>
          <Text variant="titleMedium" style={{ color }}>
            {done}/{total}
          </Text>
        </View>
      ) : null}

      <Text variant="bodyMedium" style={{ color }}>
        {motivation(done, total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, gap: 6 },
  subtitle: { opacity: 0.8, marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  flex: { flex: 1 },
  progress: { height: 10, borderRadius: 5 },
});
