import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '../lib/theme';

// Okrągła zębatka w prawym górnym rogu – otwiera wybór wyglądu
export function SettingsButton() {
  const theme = useAppTheme();

  return (
    <IconButton
      icon="cog"
      size={24}
      mode="contained"
      containerColor={theme.colors.surface}
      iconColor={theme.colors.onSurface}
      accessibilityLabel="Ustawienia wyglądu"
      onPress={() => router.push('/settings')}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-end', margin: 12 },
});
