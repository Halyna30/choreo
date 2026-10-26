import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Zaloguj się</Text>
      <Link href="/sign-up">
        <Text variant="bodyMedium">Nie masz konta? Zarejestruj się</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 },
});