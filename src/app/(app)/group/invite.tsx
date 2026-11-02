import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, View } from 'react-native';
import { KeyboardScrollView } from '../../../components/KeyboardScrollView';
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
import { formatDate, roleLabel } from '../../../features/groups/roles';
import type { GroupInvite, InviteRole } from '../../../features/groups/types';
import { toUserMessage } from '../../../lib/errors';

export default function InviteScreen() {
  const { t } = useTranslation();
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
    const message = t('invite.shareMessage', {
      group: groupName,
      code: invite.code,
      date: formatDate(invite.expires_at, t),
    });
    try {
      await Share.share({ message });
    } catch {
      // np. przeglądarka bez obsługi udostępniania – kod i tak jest widoczny na ekranie
    }
  }

  function describeInvite(invite: GroupInvite) {
    return [
      roleLabel(invite.role, t),
      invite.label,
      t('invite.validUntil', { date: formatDate(invite.expires_at, t) }),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return (
    <KeyboardScrollView contentContainerStyle={styles.container}>
      <Text variant="bodyMedium">
        {t('invite.intro')}
      </Text>

      <SegmentedButtons
        value={role}
        onValueChange={(value) => setRole(value as InviteRole)}
        buttons={[
          { value: 'adult', label: roleLabel('adult', t), icon: 'account-tie' },
          { value: 'child', label: roleLabel('child', t), icon: 'human-child' },
        ]}
      />
      <HelperText type="info">
        {role === 'adult' ? t('invite.adultHint') : t('invite.childHint')}
      </HelperText>

      <TextInput
        label={t('invite.label')}
        placeholder={role === 'adult' ? t('invite.adultPlaceholder') : t('invite.childPlaceholder')}
        mode="outlined"
        value={label}
        onChangeText={setLabel}
        maxLength={30}
      />

      <HelperText type="error" visible={Boolean(createInvite.error)}>
        {createInvite.error ? toUserMessage(createInvite.error, t) : null}
      </HelperText>

      <Button
        mode="contained"
        icon="ticket-confirmation"
        onPress={handleCreate}
        loading={createInvite.isPending}
        disabled={createInvite.isPending}
      >
        {t('invite.create')}
      </Button>

      {createdInvite ? (
        <Card mode="contained">
          <Card.Content style={styles.codeCard}>
            <Text variant="labelLarge">{t('invite.code')}</Text>
            <Text variant="displaySmall" selectable style={styles.code}>
              {createdInvite.code}
            </Text>
            <Text variant="bodySmall">{describeInvite(createdInvite)}</Text>
          </Card.Content>
          <Card.Actions>
            <Button icon="share-variant" onPress={() => handleShare(createdInvite)}>
              {t('invite.send')}
            </Button>
          </Card.Actions>
        </Card>
      ) : null}

      {invites && invites.length > 0 ? (
        <View>
          <List.Subheader>{t('invite.active')}</List.Subheader>
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
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  codeCard: { alignItems: 'center', gap: 4 },
  code: { fontWeight: 'bold', letterSpacing: 4 },
  listCode: { fontWeight: 'bold', letterSpacing: 2 },
  actions: { flexDirection: 'row' },
});
