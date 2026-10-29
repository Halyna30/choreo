import { Avatar } from 'react-native-paper';
import { useMemberColor } from '../features/groups/colors';
import { boldFont, useAppTheme } from '../lib/theme';

type Props = {
  userId: string | undefined;
  name: string;
  size?: number;
};

export function MemberAvatar({ userId, name, size = 40 }: Props) {
  const theme = useAppTheme();
  const color = useMemberColor(userId);

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
