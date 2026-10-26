import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function GroupScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Zadania grupy</Text>
      <Text variant="bodyMedium">Tu zobaczysz zadania wszystkich członków.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
});