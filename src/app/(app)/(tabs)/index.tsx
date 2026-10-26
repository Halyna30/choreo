import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Moje zadania na dziś</Text>
      <Text variant="bodyMedium">Tu pojawi się lista Twoich zadań.</Text>
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/task/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});