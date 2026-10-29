import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../lib/theme';

type Props = {
  title?: string;
  subtitle?: string;
};

// Logo „Choreo” z listkiem i podtytuł na ekranach logowania i powitania
export function BrandHeader({ title = 'Choreo', subtitle }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text variant="displayMedium" style={[styles.title, { color: theme.brand.titleColor }]}>
          {title}
        </Text>
        {theme.brand.leaf ? (
          <View style={styles.leaf}>
            <Icon source="sprout" size={30} color={theme.brand.leaf} />
          </View>
        ) : null}
      </View>
      {subtitle ? (
        <Text
          variant="titleMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4, marginBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { textAlign: 'center' },
  leaf: { marginLeft: -2, marginTop: -6 },
  subtitle: { textAlign: 'center' },
});
