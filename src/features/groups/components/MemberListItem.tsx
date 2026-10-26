import { Avatar, List } from 'react-native-paper';
import { ROLE_LABELS, getMemberName } from '../roles';
import type { GroupMember } from '../types';

type Props = {
  member: GroupMember;
  isMe: boolean;
  onPress?: () => void;
};

export function MemberListItem({ member, isMe, onPress }: Props) {
  const name = getMemberName(member);

  const details = [
    member.label ? member.profile?.display_name : null,
    ROLE_LABELS[member.role],
    isMe ? 'To Ty' : null,
  ].filter(Boolean);

  return (
    <List.Item
      title={name}
      description={details.join(' · ')}
      onPress={onPress}
      left={(props) => (
        <Avatar.Text size={40} label={name.charAt(0).toUpperCase()} style={props.style} />
      )}
      right={onPress ? (props) => <List.Icon {...props} icon="chevron-right" /> : undefined}
    />
  );
}
