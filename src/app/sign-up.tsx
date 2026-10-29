import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '../components/BrandHeader';
import { GradientButton } from '../components/GradientButton';
import { ScreenBackground } from '../components/ScreenBackground';
import { SettingsButton } from '../components/SettingsButton';
import {
  MIN_PASSWORD_LENGTH,
  getAuthErrorMessage,
  isValidEmail,
} from '../features/auth/authErrors';
import { supabase } from '../lib/supabase';

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
    <ScreenBackground>
      <SafeAreaView style={styles.flex}>
        <SettingsButton />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <BrandHeader subtitle="Utwórz konto" />

            <View style={styles.fields}>
              <TextInput
                label="Imię"
                mode="outlined"
                value={displayName}
                onChangeText={setDisplayName}
                left={<TextInput.Icon icon="account" />}
                autoComplete="name"
                textContentType="givenName"
              />
              <TextInput
                label="E-mail"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                left={<TextInput.Icon icon="email" />}
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
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword((value) => !value)}
                  />
                }
                onSubmitEditing={handleSignUp}
              />
            </View>

            <HelperText type="error" visible={Boolean(error)}>
              {error}
            </HelperText>
            {info ? <HelperText type="info">{info}</HelperText> : null}

            <GradientButton onPress={handleSignUp} loading={isSubmitting} disabled={isSubmitting}>
              Zarejestruj się
            </GradientButton>

            <Link href="/sign-in" asChild>
              <Button mode="text" style={styles.link}>
                Masz już konto? Zaloguj się
              </Button>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 0 },
  fields: { gap: 12 },
  link: { marginTop: 12 },
});
