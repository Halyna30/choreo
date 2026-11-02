import { useTranslation } from 'react-i18next';
import { List } from 'react-native-paper';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { useAppTheme } from '../../../lib/theme';
import { getMemberName, roleLabel } from '../roles';
import type { GroupMember } from '../types';

type Props = {
  member: GroupMember;
  isMe: boolean;
  onPress?: () => void;
};

export function MemberListItem({ member, isMe, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const name = getMemberName(member, t);

  const details = [
    member.label ? member.profile?.display_name : null,
    roleLabel(member.role, t),
    isMe ? t('common.you') : null,
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
