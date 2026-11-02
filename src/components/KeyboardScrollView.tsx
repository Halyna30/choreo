import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useContext } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Przewijany ekran z formularzem.
// Android rysuje aplikację pod paskami systemu (edge-to-edge) i przy otwartej klawiaturze
// nie zmniejsza okna, więc sami robimy miejsce na klawiaturę i na dolny pasek nawigacji.
export function KeyboardScrollView({ contentContainerStyle, ...props }: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  // poza ekranem z nagłówkiem kontekstu nie ma – wtedy przesunięcie wynosi 0
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        {...props}
        contentContainerStyle={[contentContainerStyle, { paddingBottom: insets.bottom + 24 }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
