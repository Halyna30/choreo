import { List } from 'react-native-paper';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { useAppTheme } from '../../../lib/theme';
import { ROLE_LABELS, getMemberName } from '../roles';
import type { GroupMember } from '../types';

type Props = {
  member: GroupMember;
  isMe: boolean;
  onPress?: () => void;
};

export function MemberListItem({ member, isMe, onPress }: Props) {
  const theme = useAppTheme();
  const name = getMemberName(member);

  const details = [
    member.label ? member.profile?.display_name : null,
    ROLE_LABELS[member.role],
    isMe ? 'To Ty' : null,
  ].filter(Boolean);

  return (
    <List.Item
      title={name}
      titleStyle={theme.fonts.titleMedium}
      description={details.join(' · ')}
      onPress={onPress}
      style={{ paddingLeft: 12 }}
      left={() => (
        <MemberAvatar userId={member.user_id} name={name} avatarUrl={member.profile?.avatar_url} />
      )}
      right={onPress ? (props) => <List.Icon {...props} icon="chevron-right" /> : undefined}
    />
  );
}
