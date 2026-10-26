import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import {
  MIN_PASSWORD_LENGTH,
  getAuthErrorMessage,
  isValidEmail,
} from '../../features/auth/authErrors';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    setError(null);
    setInfo(null);

    if (!displayName.trim()) {
      setError('Wpisz swoje imię.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Wpisz poprawny adres e-mail.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
      return;
    }

    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // trafia do raw_user_meta_data, a trigger w bazie tworzy z tego profil
      options: { data: { display_name: displayName.trim() } },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError));
      return;
    }

    // Gdy potwierdzanie e-maila jest włączone, sesji jeszcze nie ma
    if (!data.session) {
      setInfo('Sprawdź skrzynkę e-mail i kliknij link, aby potwierdzić konto.');
    }
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
          <Text variant="titleMedium">Utwórz konto</Text>
        </View>

        <TextInput
          label="Imię"
          mode="outlined"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          textContentType="givenName"
        />
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
          autoComplete="new-password"
          textContentType="newPassword"
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword((value) => !value)}
            />
          }
          onSubmitEditing={handleSignUp}
        />

        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        {info ? <HelperText type="info">{info}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Zarejestruj się
        </Button>

        <Link href="/sign-in" asChild>
          <Button mode="text">Masz już konto? Zaloguj się</Button>
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
