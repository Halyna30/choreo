import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, List, Text } from 'react-native-paper';
import { useAuth } from '../../../features/auth/AuthProvider';
import { MemberListItem } from '../../../features/groups/components/MemberListItem';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { ROLE_LABELS } from '../../../features/groups/roles';
import { queryClient } from '../../../lib/queryClient';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { data: membership } = useCurrentMembership();
  const { data: members, isLoading: membersLoading } = useGroupMembers(membership?.group_id);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const displayName: string = user?.user_metadata?.display_name ?? 'Użytkownik';
  const isOwner = membership?.role === 'owner';

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // Czyścimy cache, żeby kolejna osoba na tym telefonie nie zobaczyła cudzych danych
    queryClient.clear();
  }

  function openMember(userId: string) {
    router.push({ pathname: '/group/member/[userId]', params: { userId } });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={72} label={displayName.charAt(0).toUpperCase()} />
        <Text variant="titleLarge">{membership?.label || displayName}</Text>
        <Text variant="bodyMedium">{user?.email}</Text>
        {membership ? (
          <Text variant="labelLarge">{ROLE_LABELS[membership.role]}</Text>
        ) : null}
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>Grupa: {membership?.group.name}</List.Subheader>
        {membersLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          members?.map((member) => {
            const isMe = member.user_id === user?.id;
            // Zarządca może otworzyć każdego, pozostali tylko siebie
            const canOpen = isOwner || isMe;
            return (
              <MemberListItem
                key={member.user_id}
                member={member}
                isMe={isMe}
                onPress={canOpen ? () => openMember(member.user_id) : undefined}
              />
            );
          })
        )}
      </List.Section>

      {isOwner ? (
        <Button mode="contained" icon="account-plus" onPress={() => router.push('/group/invite')}>
          Zaproś do grupy
        </Button>
      ) : null}

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleSignOut}
        loading={isSigningOut}
        disabled={isSigningOut}
      >
        Wyloguj się
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  header: { alignItems: 'center', gap: 6, marginTop: 16 },
  loader: { marginVertical: 16 },
});
