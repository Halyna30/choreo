import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '../../components/BrandHeader';
import { GradientButton } from '../../components/GradientButton';
import { ScreenBackground } from '../../components/ScreenBackground';
import { SettingsButton } from '../../components/SettingsButton';
import { useCreateGroup, useJoinGroup } from '../../features/groups/hooks';
import { toUserMessage } from '../../lib/errors';
import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../lib/theme';

type Mode = 'create' | 'join';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [mode, setMode] = useState<Mode>('create');
  const [groupName, setGroupName] = useState('');
  const [myLabel, setMyLabel] = useState('');
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const activeMutation = mode === 'create' ? createGroup : joinGroup;
  const error =
    validationError ?? (activeMutation.error ? toUserMessage(activeMutation.error, t) : null);

  function handleModeChange(value: string) {
    setMode(value as Mode);
    setValidationError(null);
    createGroup.reset();
    joinGroup.reset();
  }

  function handleCreate() {
    setValidationError(null);
    if (!groupName.trim()) {
      setValidationError(t('onboarding.enterGroupName'));
      return;
    }
    // Po sukcesie lista członkostw się odświeży, a nawigacja sama przejdzie do zakładek
    createGroup.mutate({ name: groupName, label: myLabel });
  }

  function handleJoin() {
    setValidationError(null);
    if (code.trim().length !== 8) {
      setValidationError(t('onboarding.codeLength'));
      return;
    }
    joinGroup.mutate(code);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.flex}>
        <SettingsButton />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <BrandHeader subtitle={t('onboarding.welcome')} />

            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
              ]}
            >
              <SegmentedButtons
                value={mode}
                onValueChange={handleModeChange}
                buttons={[
                  { value: 'create', label: t('onboarding.createGroup'), icon: 'account-group' },
                  { value: 'join', label: t('onboarding.haveCode'), icon: 'key' },
                ]}
              />

              {mode === 'create' ? (
                <View style={styles.form}>
                  <TextInput
                    label={t('onboarding.groupName')}
                    placeholder={t('onboarding.groupNamePlaceholder')}
                    mode="outlined"
                    value={groupName}
                    onChangeText={setGroupName}
                    left={<TextInput.Icon icon="home-heart" />}
                    maxLength={60}
                  />
                  <TextInput
                    label={t('onboarding.myLabel')}
                    placeholder={t('onboarding.myLabelPlaceholder')}
                    mode="outlined"
                    value={myLabel}
                    onChangeText={setMyLabel}
                    left={<TextInput.Icon icon="tag-heart" />}
                    maxLength={30}
                  />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('onboarding.ownerHint')}
                  </Text>
                </View>
              ) : (
                <View style={styles.form}>
                  <TextInput
                    label={t('onboarding.inviteCode')}
                    placeholder={t('onboarding.inviteCodePlaceholder')}
                    mode="outlined"
                    value={code}
                    onChangeText={(text) => setCode(text.toUpperCase())}
                    left={<TextInput.Icon icon="ticket-confirmation" />}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                  />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('onboarding.codeHint')}
                  </Text>
                </View>
              )}

              <HelperText type="error" visible={Boolean(error)}>
                {error}
              </HelperText>

              <GradientButton
                onPress={mode === 'create' ? handleCreate : handleJoin}
                loading={activeMutation.isPending}
                disabled={activeMutation.isPending}
              >
                {mode === 'create' ? t('onboarding.createGroup') : t('onboarding.joinGroup')}
              </GradientButton>
            </View>

            <Button mode="text" onPress={handleSignOut} style={styles.signOut}>
              {t('common.signOut')}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 0 },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  form: { gap: 10 },
  signOut: { marginTop: 16 },
});
