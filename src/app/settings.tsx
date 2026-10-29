import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, SegmentedButtons, Text } from 'react-native-paper';
import { useSettings } from '../features/settings/SettingsProvider';
import {
  COLOR_MODE_OPTIONS,
  THEME_OPTIONS,
  buildTheme,
  useAppTheme,
  type ColorMode,
  type ThemeName,
} from '../lib/theme';

// Mały podgląd motywu: tło, karta i przycisk w jego kolorach
function ThemePreview({ name, dark }: { name: ThemeName; dark: boolean }) {
  const preview = buildTheme(name, dark);
  const button = preview.brand.buttonGradient?.[0] ?? preview.colors.primary;

  return (
    <View style={[styles.preview, { backgroundColor: preview.colors.background }]}>
      {preview.brand.blobs.slice(0, 2).map((blob, index) => (
        <View
          key={index}
          style={[
            styles.previewBlob,
            {
              backgroundColor: blob.color,
              opacity: blob.opacity,
              top: index === 0 ? -14 : undefined,
              bottom: index === 1 ? -14 : undefined,
              left: index === 0 ? -14 : undefined,
              right: index === 1 ? -14 : undefined,
            },
          ]}
        />
      ))}
      <View style={[styles.previewCard, { backgroundColor: preview.colors.surface }]} />
      <View style={[styles.previewButton, { backgroundColor: button }]} />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { settings, setThemeName, setColorMode } = useSettings();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Motyw</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Wygląd zapisuje się na tym telefonie – każdy w rodzinie może mieć swój.
      </Text>

      {THEME_OPTIONS.map((option) => {
        const selected = settings.themeName === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setThemeName(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                backgroundColor: theme.colors.surface,
                borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <ThemePreview name={option.value} dark={theme.dark} />
            <View style={styles.optionText}>
              <View style={styles.optionTitle}>
                <Icon source={option.icon} size={18} color={theme.colors.primary} />
                <Text variant="titleMedium">{option.label}</Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {option.description}
              </Text>
            </View>
            <Icon
              source={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={selected ? theme.colors.primary : theme.colors.outline}
            />
          </Pressable>
        );
      })}

      <Text variant="titleLarge" style={styles.section}>
        Tryb
      </Text>
      <SegmentedButtons
        value={settings.colorMode}
        onValueChange={(value) => setColorMode(value as ColorMode)}
        buttons={COLOR_MODE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          icon: option.icon,
        }))}
      />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        „Auto” dopasowuje się do ustawień telefonu.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  section: { marginTop: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 20,
  },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  preview: {
    width: 64,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 8,
    justifyContent: 'flex-end',
    gap: 6,
  },
  previewBlob: { position: 'absolute', width: 48, height: 48, borderRadius: 24 },
  previewCard: { height: 22, borderRadius: 6 },
  previewButton: { height: 10, borderRadius: 5 },
});
