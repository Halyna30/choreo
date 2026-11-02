import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Icon,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { toUserMessage } from '../../../lib/errors';
import { useAppTheme } from '../../../lib/theme';
import { useAuth } from '../../auth/AuthProvider';
import {
  useAddComment,
  useCommentsRealtime,
  useDeleteComment,
  useTaskComments,
} from '../../comments/hooks';
import { getMemberName } from '../../groups/roles';
import type { GroupMember } from '../../groups/types';
import { canChangeTaskStatus, describeAssignees, isTaskPerson } from '../assignees';
import { formatFullDate, todayKey, toDateKey } from '../dates';
import { STATUS_ICONS, statusLabel } from '../status';
import type { Task, TaskStatus } from '../types';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

type Props = {
  task: Task | null;
  members: GroupMember[] | undefined;
  isManager: boolean;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
  onDismiss: () => void;
};

function formatCommentTime(iso: string, t: TFunction): string {
  const locale = t('meta.dateLocale');
  const date = new Date(iso);
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (toDateKey(date) === todayKey()) return time;
  return `${date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}, ${time}`;
}

// Okienko zadania otwierane na tym samym ekranie: status, zatwierdzanie i komentarze
export function TaskSheet({ task, members, isManager, onChangeStatus, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={Boolean(task)} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityLabel={t('common.close')}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.outline }]} />
          {task ? (
            <SheetContent
              // key: przy otwarciu innego zadania stan formularza zaczyna się od nowa
              key={task.id}
              task={task}
              members={members}
              isManager={isManager}
              onChangeStatus={onChangeStatus}
              onDismiss={onDismiss}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetContent({ task, members, isManager, onChangeStatus, onDismiss }: Props & { task: Task }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [body, setBody] = useState('');

  const { data: comments, isLoading } = useTaskComments(task.id);
  const addComment = useAddComment(task.id);
  const deleteComment = useDeleteComment(task.id);
  useCommentsRealtime(task.id);

  const isPending = task.status === 'pending';
  const isMine = isTaskPerson(task, userId);
  const canChangeStatus = canChangeTaskStatus(task, userId, isManager);
  // Dziecko komentuje swoje zadanie, gdy jest w trakcie, czeka albo jest zrobione
  const canComment = isManager || (isMine && task.status !== 'todo');

  function memberById(id: string) {
    return members?.find((member) => member.user_id === id);
  }

  function nameOf(id: string) {
    const member = memberById(id);
    return member ? getMemberName(member, t) : '—';
  }

  function handleSend() {
    if (!body.trim()) return;
    addComment.mutate(body, { onSuccess: () => setBody('') });
  }

  function handleEdit() {
    onDismiss();
    router.push({ pathname: '/task/[id]', params: { id: task.id } });
  }

  const error = addComment.error ?? deleteComment.error;

  return (
    <View style={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="headlineSmall">{task.title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {[
              describeAssignees(task, nameOf, t),
              formatFullDate(task.due_date, t),
              task.template_id ? '🔁' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <IconButton icon="close" onPress={onDismiss} accessibilityLabel={t('common.close')} />
      </View>

      {task.description ? <Text variant="bodyLarge">{task.description}</Text> : null}

      {isPending ? (
        <View style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Icon source="timer-sand" size={22} color={theme.colors.onSecondaryContainer} />
          <Text
            variant="bodyMedium"
            style={[styles.flex, { color: theme.colors.onSecondaryContainer }]}
          >
            {isManager
              ? t('sheet.childMarkedDone', {
                  name: task.completed_by ? nameOf(task.completed_by) : t('common.child'),
                })
              : t('sheet.waitingForParent')}
          </Text>
        </View>
      ) : null}

      {isPending && isManager ? (
        <View style={styles.approveRow}>
          <Button
            mode="contained"
            icon="check-decagram"
            style={styles.flex}
            buttonColor={theme.colors.success}
            textColor={theme.colors.onSuccess}
            onPress={() => onChangeStatus(task, 'done')}
          >
            {t('sheet.approve')}
          </Button>
          <Button
            mode="outlined"
            icon="undo"
            style={styles.flex}
            onPress={() => onChangeStatus(task, 'in_progress')}
          >
            {t('sheet.sendBack')}
          </Button>
        </View>
      ) : (
        <SegmentedButtons
          // "czeka na zatwierdzenie" pokazujemy jako zaznaczone "Zrobione"
          value={isPending ? 'done' : task.status}
          onValueChange={(value) => onChangeStatus(task, value as TaskStatus)}
          buttons={STATUSES.map((status) => ({
            value: status,
            label: statusLabel(status, t),
            icon: STATUS_ICONS[status],
            disabled: !canChangeStatus,
          }))}
        />
      )}

      {task.status === 'done' && !isManager && isMine ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('sheet.starIsYours')}
        </Text>
      ) : null}

      <Text variant="titleMedium" style={styles.commentsTitle}>
        {t('sheet.comments')}
      </Text>

      <ScrollView style={styles.comments} contentContainerStyle={styles.commentsContent}>
        {isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
        {!isLoading && comments?.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('sheet.noComments')}
          </Text>
        ) : null}
        {comments?.map((comment) => {
          const author = memberById(comment.author_id);
          const authorName = author ? getMemberName(author, t) : t('common.groupMember');
          const isOwn = comment.author_id === userId;
          return (
            <View key={comment.id} style={styles.comment}>
              <MemberAvatar
                userId={comment.author_id}
                name={authorName}
                avatarUrl={author?.profile?.avatar_url}
                size={32}
              />
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isOwn
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <View style={styles.bubbleHeader}>
                  <Text variant="labelMedium">{authorName}</Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatCommentTime(comment.created_at, t)}
                  </Text>
                </View>
                <Text variant="bodyMedium">{comment.body}</Text>
              </View>
              {isOwn ? (
                <IconButton
                  icon="delete-outline"
                  size={18}
                  accessibilityLabel={t('sheet.deleteComment')}
                  disabled={deleteComment.isPending}
                  onPress={() => deleteComment.mutate(comment.id)}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {canComment ? (
        <View style={styles.inputRow}>
          <TextInput
            mode="outlined"
            placeholder={t('sheet.commentPlaceholder')}
            value={body}
            onChangeText={setBody}
            maxLength={500}
            multiline
            style={styles.input}
            dense
          />
          <IconButton
            icon="send"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            disabled={!body.trim() || addComment.isPending}
            onPress={handleSend}
            accessibilityLabel={t('sheet.sendComment')}
          />
        </View>
      ) : (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {isMine ? t('sheet.commentWhenStarted') : t('sheet.commentOwnOnly')}
        </Text>
      )}

      <HelperText type="error" visible={Boolean(error)}>
        {error ? toUserMessage(error, t) : null}
      </HelperText>

      {isManager ? (
        <Button mode="outlined" icon="pencil" onPress={handleEdit}>
          {t('sheet.edit')}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, opacity: 0.5 },
  content: { gap: 12, paddingTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  approveRow: { flexDirection: 'row', gap: 10 },
  commentsTitle: { marginTop: 4 },
  comments: { maxHeight: 240 },
  commentsContent: { gap: 10 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble: { flex: 1, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, gap: 2 },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { flex: 1, maxHeight: 100 },
});
