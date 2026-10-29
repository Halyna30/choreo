import { StyleSheet, Text as NativeText, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useMemberColor } from '../features/groups/colors';
import { parseAvatar } from '../features/profile/avatars';
import { boldFont, useAppTheme } from '../lib/theme';

type Props = {
  userId: string | undefined;
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

// Zdjęcie, gotowy awatar (emoji) albo pierwsza litera imienia na kolorze członka
export function MemberAvatar({ userId, name, avatarUrl, size = 40 }: Props) {
  const theme = useAppTheme();
  const color = useMemberColor(userId);
  const avatar = parseAvatar(avatarUrl);

  if (avatar.type === 'photo') {
    return (
      <Avatar.Image
        size={size}
        source={{ uri: avatar.uri }}
        style={{ backgroundColor: color.background }}
      />
    );
  }

  if (avatar.type === 'preset') {
    return (
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color.background },
        ]}
      >
        <NativeText style={{ fontSize: size * 0.56, lineHeight: size * 0.72 }}>
          {avatar.emoji}
        </NativeText>
      </View>
    );
  }

  return (
    <Avatar.Text
      size={size}
      label={name.trim().charAt(0).toUpperCase() || '?'}
      color={color.foreground}
      style={{ backgroundColor: color.background }}
      labelStyle={{ fontFamily: boldFont(theme) }}
    />
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
