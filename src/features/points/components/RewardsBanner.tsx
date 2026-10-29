import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { plural } from '../../../lib/plural';
import { useAppTheme } from '../../../lib/theme';

type Props = {
  isChild: boolean;
  stars: number;
  claps: number;
};

// Duży licznik w profilu: ⭐ dla dzieci, 👏 dla dorosłych
export function RewardsBanner({ isChild, stars, claps }: Props) {
  const theme = useAppTheme();
  const count = isChild ? stars : claps;

  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.tertiaryContainer }]}>
      <Text style={styles.icon}>{isChild ? '⭐' : '👏'}</Text>
      <View style={styles.flex}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onTertiaryContainer }}>
          {count}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer }}>
          {isChild
            ? `${plural(count, 'gwiazdka', 'gwiazdki', 'gwiazdek')} do wydania`
            : `${plural(count, 'klepnięcie', 'klepnięcia', 'klepnięć')} po plecach za zrobione zadania`}
        </Text>
      </View>
    </View>
  );
}

// Mała plakietka przy osobie, np. na zakładce Grupa
export function RewardChip({ isChild, stars, claps }: Props) {
  const theme = useAppTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.colors.tertiaryContainer }]}>
      <Text variant="labelLarge" style={{ color: theme.colors.onTertiaryContainer }}>
        {isChild ? `⭐ ${stars}` : `👏 ${claps}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24 },
  icon: { fontSize: 40, lineHeight: 48 },
  flex: { flex: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
});
