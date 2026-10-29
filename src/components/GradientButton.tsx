import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../lib/theme';

type Props = {
  children: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

// Główny przycisk: w motywach z gradientem świeci kolorami, w pozostałych jest jednolity
export function GradientButton({ children, onPress, loading, disabled, icon, style }: Props) {
  const theme = useAppTheme();
  const gradient = theme.brand.buttonGradient;

  if (!gradient) {
    return (
      <Button
        mode="contained"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        icon={icon}
        style={[styles.flatButton, style]}
        contentStyle={styles.content}
      >
        {children}
      </Button>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.shadow,
        { shadowColor: gradient[1], opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            {icon ? <Icon source={icon} size={18} color="#FFFFFF" /> : null}
            <Text variant="labelLarge" style={styles.label}>
              {children}
            </Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flatButton: { borderRadius: 28 },
  content: { height: 52 },
  shadow: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  gradient: {
    height: 52,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { color: '#FFFFFF', fontSize: 16 },
});
