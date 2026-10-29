import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Snackbar, Text } from 'react-native-paper';
import { MemberAvatar } from '../../components/MemberAvatar';
import { SectionCard } from '../../components/SectionCard';
import { useAuth } from '../../features/auth/AuthProvider';
import { useCurrentMembership, useGroupMembers } from '../../features/groups/hooks';
import { getMemberName } from '../../features/groups/roles';
import { PRESET_AVATARS, parseAvatar, presetValue } from '../../features/profile/avatars';
import { useSetAvatar, useUploadAvatar } from '../../features/profile/hooks';
import { toUserMessage } from '../../lib/errors';
import { useAppTheme } from '../../lib/theme';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6,
};

export default function AvatarScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: membership } = useCurrentMembership();
  const { data: members } = useGroupMembers(membership?.group_id);
  const me = members?.find((member) => member.user_id === userId);

  const setAvatar = useSetAvatar();
  const uploadAvatar = useUploadAvatar();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = parseAvatar(me?.profile?.avatar_url);
  const name = me ? getMemberName(me) : (session?.user.user_metadata?.display_name ?? '?');
  const isBusy = setAvatar.isPending || uploadAvatar.isPending;
  const error = permissionError ?? (setAvatar.error ?? uploadAvatar.error
    ? toUserMessage(setAvatar.error ?? uploadAvatar.error)
    : null);

  function onSaved() {
    setSaved(true);
  }

  async function pickPhoto(source: 'library' | 'camera') {
    setPermissionError(null);

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPermissionError('Brak dostępu do aparatu. Zezwól na niego w ustawieniach telefonu.');
        return;
      }
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadAvatar.mutate({ uri: asset.uri, mimeType: asset.mimeType }, { onSuccess: onSaved });
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.preview}>
          <MemberAvatar
            userId={userId}
            name={name}
            avatarUrl={me?.profile?.avatar_url}
            size={120}
          />
          {isBusy ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>

        <SectionCard title="Twoje zdjęcie">
          <View style={styles.photoButtons}>
            <Button
              mode="contained-tonal"
              icon="image"
              disabled={isBusy}
              onPress={() => pickPhoto('library')}
            >
              Z galerii
            </Button>
            {Platform.OS !== 'web' ? (
              <Button
                mode="contained-tonal"
                icon="camera"
                disabled={isBusy}
                onPress={() => pickPhoto('camera')}
              >
                Zrób zdjęcie
              </Button>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Albo wybierz postać">
          <View style={styles.grid}>
            {PRESET_AVATARS.map((preset) => {
              const selected = current.type === 'preset' && current.key === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  disabled={isBusy}
                  onPress={() => setAvatar.mutate(presetValue(preset.key), { onSuccess: onSaved })}
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  accessibilityState={{ selected }}
                  style={styles.presetCell}
                >
                  <View
                    style={[
                      styles.presetRing,
                      { borderColor: selected ? theme.colors.primary : 'transparent' },
                    ]}
                  >
                    <MemberAvatar
                      userId={`${userId}-${preset.key}`}
                      name={preset.label}
                      avatarUrl={presetValue(preset.key)}
                      size={56}
                    />
                  </View>
                  <Text
                    variant="labelSmall"
                    numberOfLines={1}
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>

        {current.type !== 'none' ? (
          <Button
            mode="text"
            icon="account-remove"
            disabled={isBusy}
            onPress={() => setAvatar.mutate(null, { onSuccess: onSaved })}
          >
            Usuń awatar (pokaż inicjał)
          </Button>
        ) : null}
      </ScrollView>

      <Snackbar visible={saved} onDismiss={() => setSaved(false)} duration={2000}>
        Awatar zapisany ✨
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 20, paddingBottom: 40 },
  preview: { alignItems: 'center', gap: 12, marginTop: 8 },
  photoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  presetCell: { width: '20%', alignItems: 'center', gap: 4, paddingVertical: 8 },
  presetRing: { borderWidth: 3, borderRadius: 34, padding: 2 },
});
