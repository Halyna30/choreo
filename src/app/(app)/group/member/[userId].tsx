import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Divider,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { MemberAvatar } from '../../../../components/MemberAvatar';
import { useAuth } from '../../../../features/auth/AuthProvider';
import {
  useCurrentMembership,
  useGroupMembers,
  useRemoveMember,
  useUpdateMember,
} from '../../../../features/groups/hooks';
import { ROLE_LABELS, getMemberName } from '../../../../features/groups/roles';
import type { GroupMember, InviteRole } from '../../../../features/groups/types';
import { toUserMessage } from '../../../../lib/errors';

export default function MemberScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useAuth();
  const { data: membership } = useCurrentMembership();
  const { data: members, isLoading } = useGroupMembers(membership?.group_id);

  const member = members?.find((m) => m.user_id === userId);

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!member || !membership) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">Nie znaleziono członka grupy.</Text>
      </View>
    );
  }

  // Formularz renderujemy dopiero z danymi, żeby stan początkowy był poprawny
  return (
    <MemberForm
      key={member.user_id}
      member={member}
      groupId={membership.group_id}
      isMe={member.user_id === session?.user.id}
      isOwner={membership.role === 'owner'}
    />
  );
}

type MemberFormProps = {
  member: GroupMember;
  groupId: string;
  isMe: boolean;
  isOwner: boolean;
};

function MemberForm({ member, groupId, isMe, isOwner }: MemberFormProps) {
  const [label, setLabel] = useState(member.label ?? '');
  const [role, setRole] = useState<InviteRole>(member.role === 'adult' ? 'adult' : 'child');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const updateMember = useUpdateMember(groupId);
  const removeMember = useRemoveMember(groupId);

  const memberIsOwner = member.role === 'owner';
  const canEditLabel = isOwner || isMe;
  const canEditRole = isOwner && !memberIsOwner;
  const canRemove = isOwner && !memberIsOwner && !isMe;
  const canLeave = isMe && !memberIsOwner;

  const error = updateMember.error ?? removeMember.error;

  function handleSave() {
    updateMember.mutate(
      {
        groupId,
        userId: member.user_id,
        label,
        role: canEditRole ? role : undefined,
      },
      { onSuccess: () => router.back() },
    );
  }

  function handleRemove() {
    removeMember.mutate(
      { groupId, userId: member.user_id },
      {
        onSuccess: () => {
          setConfirmVisible(false);
          // Gdy ktoś opuszcza grupę, nawigacja sama przejdzie do ekranu powitalnego
          if (!isMe) router.back();
        },
      },
    );
  }

  const name = getMemberName(member);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <MemberAvatar
          userId={member.user_id}
          name={name}
          avatarUrl={member.profile?.avatar_url}
          size={72}
        />
        <Text variant="titleLarge">{name}</Text>
        <Text variant="bodyMedium">
          {member.profile?.display_name} · {ROLE_LABELS[member.role]}
        </Text>
      </View>

      {canEditLabel ? (
        <TextInput
          label="Etykieta w grupie"
          placeholder="np. Mama, Tata, Babcia"
          mode="outlined"
          value={label}
          onChangeText={setLabel}
          maxLength={30}
        />
      ) : null}

      {canEditRole ? (
        <View style={styles.section}>
          <Text variant="labelLarge">Rola</Text>
          <SegmentedButtons
            value={role}
            onValueChange={(value) => setRole(value as InviteRole)}
            buttons={[
              { value: 'adult', label: 'Dorosły', icon: 'account-tie' },
              { value: 'child', label: 'Dziecko', icon: 'human-child' },
            ]}
          />
        </View>
      ) : null}

      {memberIsOwner ? (
        <HelperText type="info">Zarządca grupy ma zawsze pełne uprawnienia.</HelperText>
      ) : null}

      <HelperText type="error" visible={Boolean(error)}>
        {error ? toUserMessage(error) : null}
      </HelperText>

      {canEditLabel ? (
        <Button
          mode="contained"
          onPress={handleSave}
          loading={updateMember.isPending}
          disabled={updateMember.isPending}
        >
          Zapisz zmiany
        </Button>
      ) : null}

      {canRemove || canLeave ? (
        <>
          <Divider style={styles.divider} />
          <Button mode="outlined" icon="account-remove" onPress={() => setConfirmVisible(true)}>
            {canLeave ? 'Opuść grupę' : 'Usuń z grupy'}
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title={canLeave ? 'Opuścić grupę?' : `Usunąć ${name}?`}
        message={
          canLeave
            ? 'Stracisz dostęp do zadań tej grupy. Wrócić możesz tylko z nowym kodem zaproszenia.'
            : 'Ta osoba straci dostęp do grupy, a jej zadania zostaną usunięte.'
        }
        confirmLabel={canLeave ? 'Opuść' : 'Usuń'}
        destructive
        loading={removeMember.isPending}
        onConfirm={handleRemove}
        onDismiss={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  header: { alignItems: 'center', gap: 6, marginVertical: 8 },
  section: { gap: 8 },
  divider: { marginVertical: 8 },
  loader: { marginTop: 32 },
});
