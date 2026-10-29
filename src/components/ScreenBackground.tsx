import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../lib/theme';

// Tło z miękkimi kolorowymi plamami – wygląd zależy od wybranego motywu
export function ScreenBackground({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {theme.brand.blobs.map((blob, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: blob.size,
              height: blob.size,
              borderRadius: blob.size / 2,
              backgroundColor: blob.color,
              opacity: blob.opacity,
              top: blob.top,
              bottom: blob.bottom,
              left: blob.left,
              right: blob.right,
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
