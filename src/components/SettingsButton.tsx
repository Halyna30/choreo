import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '../lib/theme';

// Okrągła zębatka w prawym górnym rogu – otwiera wygląd i język
export function SettingsButton() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <IconButton
      icon="cog"
      size={24}
      mode="contained"
      containerColor={theme.colors.surface}
      iconColor={theme.colors.onSurface}
      accessibilityLabel={t('settings.openLabel')}
      onPress={() => router.push('/settings')}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-end', margin: 12 },
});
