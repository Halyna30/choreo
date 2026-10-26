import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { getAuthErrorMessage, isValidEmail } from '../../features/auth/authErrors';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setError(null);

    if (!isValidEmail(email)) {
      setError('Wpisz poprawny adres e-mail.');
      return;
    }
    if (!password) {
      setError('Wpisz hasło.');
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (signInError) {
      setError(getAuthErrorMessage(signInError));
    }
    // Po udanym logowaniu AuthProvider dostaje sesję, a nawigacja sama przełącza ekrany
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.logo}>
            Choreo
          </Text>
          <Text variant="titleMedium">Zaloguj się</Text>
        </View>

        <TextInput
          label="E-mail"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          label="Hasło"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword((value) => !value)}
            />
          }
          onSubmitEditing={handleSignIn}
        />

        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Zaloguj się
        </Button>

        <Link href="/sign-up" asChild>
          <Button mode="text">Nie masz konta? Zarejestruj się</Button>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  header: { alignItems: 'center', gap: 4, marginBottom: 16 },
  logo: { fontWeight: 'bold' },
});
