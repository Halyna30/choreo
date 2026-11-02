import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('auth.enterName'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.enterValidEmail'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordMin', { count: MIN_PASSWORD_LENGTH }));
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
      setError(getAuthErrorMessage(signUpError, t));
      return;
    }

    // Gdy potwierdzanie e-maila jest włączone, sesji jeszcze nie ma
    if (!data.session) {
      setInfo(t('auth.checkInbox'));
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
            <BrandHeader subtitle={t('auth.createAccount')} />

            <View style={styles.fields}>
              <TextInput
                label={t('auth.name')}
                mode="outlined"
                value={displayName}
                onChangeText={setDisplayName}
                left={<TextInput.Icon icon="account" />}
                autoComplete="name"
                textContentType="givenName"
              />
              <TextInput
                label={t('auth.email')}
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
                label={t('auth.password')}
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
              {t('auth.signUp')}
            </GradientButton>

            <Link href="/sign-in" asChild>
              <Button mode="text" style={styles.link}>
                {t('auth.haveAccount')}
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
