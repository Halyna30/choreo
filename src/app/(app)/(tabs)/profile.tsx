import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Divider, List, Text } from 'react-native-paper';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { SectionCard } from '../../../components/SectionCard';
import { useAuth } from '../../../features/auth/AuthProvider';
import { MemberListItem } from '../../../features/groups/components/MemberListItem';
import { useCurrentMembership, useGroupMembers } from '../../../features/groups/hooks';
import { ROLE_LABELS } from '../../../features/groups/roles';
import { queryClient } from '../../../lib/queryClient';
import { supabase } from '../../../lib/supabase';
import { useAppTheme } from '../../../lib/theme';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const { data: membership } = useCurrentMembership();
  const { data: members, isLoading: membersLoading } = useGroupMembers(membership?.group_id);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const displayName: string = user?.user_metadata?.display_name ?? 'Użytkownik';
  const shownName = membership?.label || displayName;
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
      <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
        <MemberAvatar userId={user?.id} name={shownName} size={84} />
        <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
          {shownName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
          {user?.email}
        </Text>
        {membership ? (
          <Chip icon="shield-account" compact style={{ backgroundColor: theme.colors.surface }}>
            {ROLE_LABELS[membership.role]}
          </Chip>
        ) : null}
      </View>

      <SectionCard title={`Grupa: ${membership?.group.name ?? ''}`}>
        {membersLoading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
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
        {isOwner ? (
          <>
            <Divider />
            <List.Item
              title="Zaproś do grupy"
              titleStyle={{ color: theme.colors.primary, fontFamily: theme.fonts.titleMedium.fontFamily }}
              left={(props) => (
                <List.Icon {...props} icon="account-plus" color={theme.colors.primary} />
              )}
              onPress={() => router.push('/group/invite')}
            />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="Ustawienia">
        <List.Item
          title="Zadania cykliczne"
          description="Codzienne i cotygodniowe obowiązki"
          left={(props) => <List.Icon {...props} icon="repeat" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/templates')}
        />
        <Divider />
        <List.Item
          title="Wygląd"
          description="Motyw i tryb jasny lub ciemny"
          left={(props) => <List.Icon {...props} icon="palette" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings')}
        />
        <Divider />
        <List.Item
          title={isSigningOut ? 'Wylogowywanie…' : 'Wyloguj się'}
          titleStyle={{ color: theme.colors.error }}
          left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
          onPress={isSigningOut ? undefined : handleSignOut}
        />
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20, paddingBottom: 32 },
  hero: { alignItems: 'center', gap: 6, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 16 },
  loader: { marginVertical: 16 },
});
