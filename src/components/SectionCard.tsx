import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../lib/theme';

type Props = PropsWithChildren<{
  title?: string;
  style?: StyleProp<ViewStyle>;
}>;

// Zaokrąglona karta z opcjonalnym tytułem sekcji
export function SectionCard({ title, style, children }: Props) {
  const theme = useAppTheme();

  return (
    <View style={style}>
      {title ? (
        <Text
          variant="labelLarge"
          style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginLeft: 8, marginBottom: 6, letterSpacing: 0.8 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', paddingVertical: 4 },
});
