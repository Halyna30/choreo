import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '../components/BrandHeader';
import { GradientButton } from '../components/GradientButton';
import { ScreenBackground } from '../components/ScreenBackground';
import { SettingsButton } from '../components/SettingsButton';
import { getAuthErrorMessage, isValidEmail } from '../features/auth/authErrors';
import { supabase } from '../lib/supabase';

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
    <ScreenBackground>
      <SafeAreaView style={styles.flex}>
        <SettingsButton />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <BrandHeader subtitle="Zaloguj się" />

            <View style={styles.fields}>
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
                autoComplete="current-password"
                textContentType="password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword((value) => !value)}
                  />
                }
                onSubmitEditing={handleSignIn}
              />
            </View>

            <HelperText type="error" visible={Boolean(error)}>
              {error}
            </HelperText>

            <GradientButton onPress={handleSignIn} loading={isSubmitting} disabled={isSubmitting}>
              Zaloguj się
            </GradientButton>

            <Link href="/sign-up" asChild>
              <Button mode="text" style={styles.link}>
                Nie masz konta? Zarejestruj się
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
