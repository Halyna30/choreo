import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Utwórz konto</Text>
      <Link href="/sign-in">
        <Text variant="bodyMedium">Masz już konto? Zaloguj się</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 },
});