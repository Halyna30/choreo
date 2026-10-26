import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  IconButton,
  List,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import {
  useActiveInvites,
  useCreateInvite,
  useCurrentMembership,
  useDeleteInvite,
} from '../../../features/groups/hooks';
import { ROLE_LABELS, formatDate } from '../../../features/groups/roles';
import type { GroupInvite, InviteRole } from '../../../features/groups/types';
import { toUserMessage } from '../../../lib/errors';

export default function InviteScreen() {
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const groupName = membership?.group.name ?? '';

  const [role, setRole] = useState<InviteRole>('child');
  const [label, setLabel] = useState('');
  const [createdInvite, setCreatedInvite] = useState<GroupInvite | null>(null);

  const { data: invites } = useActiveInvites(groupId);
  const createInvite = useCreateInvite(groupId);
  const deleteInvite = useDeleteInvite(groupId);

  function handleCreate() {
    if (!groupId) return;
    createInvite.mutate(
      { groupId, role, label },
      {
        onSuccess: (invite) => {
          setCreatedInvite(invite);
          setLabel('');
        },
      },
    );
  }

  async function handleShare(invite: GroupInvite) {
    const message =
      `Dołącz do grupy „${groupName}” w aplikacji Choreo! ` +
      `Twój kod zaproszenia: ${invite.code} (ważny do ${formatDate(invite.expires_at)}).`;
    try {
      await Share.share({ message });
    } catch {
      // np. przeglądarka bez obsługi udostępniania – kod i tak jest widoczny na ekranie
    }
  }

  function describeInvite(invite: GroupInvite) {
    return [ROLE_LABELS[invite.role], invite.label, `ważny do ${formatDate(invite.expires_at)}`]
      .filter(Boolean)
      .join(' · ');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="bodyMedium">
        Wybierz rolę nowej osoby. Kod jest jednorazowy i ważny przez 7 dni.
      </Text>

      <SegmentedButtons
        value={role}
        onValueChange={(value) => setRole(value as InviteRole)}
        buttons={[
          { value: 'adult', label: 'Dorosły', icon: 'account-tie' },
          { value: 'child', label: 'Dziecko', icon: 'human-child' },
        ]}
      />
      <HelperText type="info">
        {role === 'adult'
          ? 'Dorosły może dodawać i edytować zadania wszystkich członków.'
          : 'Dziecko widzi zadania grupy i zmienia tylko status swoich zadań.'}
      </HelperText>

      <TextInput
        label="Etykieta (opcjonalnie)"
        placeholder={role === 'adult' ? 'np. Tata, Babcia' : 'np. Córka, Syn'}
        mode="outlined"
        value={label}
        onChangeText={setLabel}
        maxLength={30}
      />

      <HelperText type="error" visible={Boolean(createInvite.error)}>
        {createInvite.error ? toUserMessage(createInvite.error) : null}
      </HelperText>

      <Button
        mode="contained"
        icon="ticket-confirmation"
        onPress={handleCreate}
        loading={createInvite.isPending}
        disabled={createInvite.isPending}
      >
        Utwórz zaproszenie
      </Button>

      {createdInvite ? (
        <Card mode="contained">
          <Card.Content style={styles.codeCard}>
            <Text variant="labelLarge">Kod zaproszenia</Text>
            <Text variant="displaySmall" selectable style={styles.code}>
              {createdInvite.code}
            </Text>
            <Text variant="bodySmall">{describeInvite(createdInvite)}</Text>
          </Card.Content>
          <Card.Actions>
            <Button icon="share-variant" onPress={() => handleShare(createdInvite)}>
              Wyślij zaproszenie
            </Button>
          </Card.Actions>
        </Card>
      ) : null}

      {invites && invites.length > 0 ? (
        <View>
          <List.Subheader>Aktywne zaproszenia</List.Subheader>
          {invites.map((invite) => (
            <List.Item
              key={invite.id}
              title={invite.code}
              description={describeInvite(invite)}
              titleStyle={styles.listCode}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="share-variant" onPress={() => handleShare(invite)} />
                  <IconButton
                    icon="delete-outline"
                    disabled={deleteInvite.isPending}
                    onPress={() => {
                      deleteInvite.mutate(invite.id);
                      if (createdInvite?.id === invite.id) setCreatedInvite(null);
                    }}
                  />
                </View>
              )}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  codeCard: { alignItems: 'center', gap: 4 },
  code: { fontWeight: 'bold', letterSpacing: 4 },
  listCode: { fontWeight: 'bold', letterSpacing: 2 },
  actions: { flexDirection: 'row' },
});
