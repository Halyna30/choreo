import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Profil</Text>
      <Text variant="bodyMedium">Członkowie grupy, kod zaproszenia, wylogowanie.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
});