import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { useAuth } from '../../../features/auth/AuthProvider';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const displayName: string = user?.user_metadata?.display_name ?? 'Użytkownik';

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // Po wylogowaniu nawigacja sama wraca do ekranu logowania
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={72} label={displayName.charAt(0).toUpperCase()} />
        <Text variant="titleLarge">{displayName}</Text>
        <Text variant="bodyMedium">{user?.email}</Text>
      </View>

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleSignOut}
        loading={isSigningOut}
        disabled={isSigningOut}
      >
        Wyloguj się
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 24 },
  header: { alignItems: 'center', gap: 8, marginTop: 24 },
});
