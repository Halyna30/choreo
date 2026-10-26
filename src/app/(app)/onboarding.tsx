import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateGroup, useJoinGroup } from '../../features/groups/hooks';
import { toUserMessage } from '../../lib/errors';
import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';

type Mode = 'create' | 'join';

export default function OnboardingScreen() {
  const [mode, setMode] = useState<Mode>('create');
  const [groupName, setGroupName] = useState('');
  const [myLabel, setMyLabel] = useState('');
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const activeMutation = mode === 'create' ? createGroup : joinGroup;
  const error = validationError ?? (activeMutation.error ? toUserMessage(activeMutation.error) : null);

  function handleModeChange(value: string) {
    setMode(value as Mode);
    setValidationError(null);
    createGroup.reset();
    joinGroup.reset();
  }

  function handleCreate() {
    setValidationError(null);
    if (!groupName.trim()) {
      setValidationError('Wpisz nazwę grupy.');
      return;
    }
    // Po sukcesie lista członkostw się odświeży, a nawigacja sama przejdzie do zakładek
    createGroup.mutate({ name: groupName, label: myLabel });
  }

  function handleJoin() {
    setValidationError(null);
    if (code.trim().length !== 8) {
      setValidationError('Kod zaproszenia ma 8 znaków.');
      return;
    }
    joinGroup.mutate(code);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Witaj w Choreo!
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Utwórz grupę dla swojej rodziny albo dołącz do istniejącej za pomocą kodu
              zaproszenia.
            </Text>
          </View>

          <SegmentedButtons
            value={mode}
            onValueChange={handleModeChange}
            buttons={[
              { value: 'create', label: 'Utwórz grupę', icon: 'account-group' },
              { value: 'join', label: 'Mam kod', icon: 'key' },
            ]}
          />

          {mode === 'create' ? (
            <View style={styles.form}>
              <TextInput
                label="Nazwa grupy"
                placeholder="np. Rodzina Kowalskich"
                mode="outlined"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={60}
              />
              <TextInput
                label="Twoja etykieta (opcjonalnie)"
                placeholder="np. Mama"
                mode="outlined"
                value={myLabel}
                onChangeText={setMyLabel}
                maxLength={30}
              />
              <HelperText type="info">
                Zostaniesz zarządcą grupy i będziesz zapraszać pozostałych członków.
              </HelperText>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                label="Kod zaproszenia"
                placeholder="np. A1B2C3D4"
                mode="outlined"
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
              />
              <HelperText type="info">
                Kod dostaniesz od osoby, która zarządza grupą.
              </HelperText>
            </View>
          )}

          <HelperText type="error" visible={Boolean(error)}>
            {error}
          </HelperText>

          <Button
            mode="contained"
            onPress={mode === 'create' ? handleCreate : handleJoin}
            loading={activeMutation.isPending}
            disabled={activeMutation.isPending}
          >
            {mode === 'create' ? 'Utwórz grupę' : 'Dołącz do grupy'}
          </Button>

          <Button mode="text" onPress={handleSignOut} style={styles.signOut}>
            Wyloguj się
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  form: { gap: 4 },
  signOut: { marginTop: 24 },
});
