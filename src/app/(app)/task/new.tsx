import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function NewTaskScreen() {
  return (
    <View style={styles.container}>
      <Text variant="bodyMedium">Tu będzie formularz dodawania zadania.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});