import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { GradientButton } from '../../../components/GradientButton';
import { useCurrentMembership } from '../../../features/groups/hooks';
import type { Goal } from '../../../features/points/api';
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from '../../../features/points/hooks';
import { toUserMessage } from '../../../lib/errors';
import { useAppTheme } from '../../../lib/theme';

const EMOJIS = ['🎁', '🎬', '🍦', '🎮', '🧸', '⚽', '🚲', '🍕', '🎨', '📚', '🎢', '🐶'];
const QUICK_STARS = [5, 10, 20, 30, 50];

export default function GoalEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: membership } = useCurrentMembership();
  const groupId = membership?.group_id;
  const { data: goals, isLoading } = useGoals(groupId);

  const goal = id ? goals?.find((item) => item.id === id) : undefined;

  if (id && isLoading) return null;
  if (!groupId) return null;

  return <GoalForm key={goal?.id ?? 'new'} groupId={groupId} goal={goal} />;
}

function GoalForm({ groupId, goal }: { groupId: string; goal?: Goal }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? EMOJIS[0]);
  const [stars, setStars] = useState(String(goal?.stars_needed ?? 10));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createGoal = useCreateGoal(groupId);
  const updateGoal = useUpdateGoal(groupId);
  const deleteGoal = useDeleteGoal(groupId);
  const mutation = goal ? updateGoal : createGoal;
  const error =
    validationError ?? (mutation.error ?? deleteGoal.error
      ? toUserMessage(mutation.error ?? deleteGoal.error, t)
      : null);

  function handleSave() {
    const starsNeeded = Number.parseInt(stars, 10);
    if (!title.trim()) {
      setValidationError(t('goals.enterTitle'));
      return;
    }
    if (!Number.isFinite(starsNeeded) || starsNeeded < 1 || starsNeeded > 1000) {
      setValidationError(t('goals.starsRange'));
      return;
    }
    setValidationError(null);

    const onSuccess = () => router.back();
    if (goal) {
      updateGoal.mutate({ id: goal.id, title, emoji, starsNeeded }, { onSuccess });
    } else {
      createGoal.mutate({ groupId, title, emoji, starsNeeded }, { onSuccess });
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={[styles.preview, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Text style={styles.previewEmoji}>{emoji}</Text>
        <Text variant="titleLarge" style={{ color: theme.colors.onTertiaryContainer }}>
          {title.trim() || t('goals.myGoal')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer }}>
          {stars || '?'} ⭐
        </Text>
      </View>

      <TextInput
        label={t('goals.whatFor')}
        placeholder={t('goals.whatForPlaceholder')}
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />

      <Text variant="labelLarge">{t('goals.icon')}</Text>
      <View style={styles.emojis}>
        {EMOJIS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setEmoji(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: emoji === item }}
            style={[
              styles.emojiCell,
              {
                backgroundColor:
                  emoji === item ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                borderColor: emoji === item ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text variant="labelLarge">{t('goals.howMany')}</Text>
      <View style={styles.quick}>
        {QUICK_STARS.map((value) => (
          <Chip
            key={value}
            selected={stars === String(value)}
            mode={stars === String(value) ? 'flat' : 'outlined'}
            onPress={() => setStars(String(value))}
          >
            {value} ⭐
          </Chip>
        ))}
      </View>
      <TextInput
        label={t('goals.starsField')}
        mode="outlined"
        value={stars}
        onChangeText={(text) => setStars(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
      />

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>

      <GradientButton onPress={handleSave} loading={mutation.isPending} disabled={mutation.isPending}>
        {goal ? t('goals.save') : t('goals.add')}
      </GradientButton>

      {goal ? (
        <Button mode="text" icon="delete-outline" onPress={() => setConfirmDelete(true)}>
          {t('goals.delete')}
        </Button>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title={t('goals.confirmDelete')}
        message={t('goals.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteGoal.isPending}
        onConfirm={() =>
          goal &&
          deleteGoal.mutate(goal.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.back();
            },
          })
        }
        onDismiss={() => setConfirmDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  preview: { alignItems: 'center', gap: 4, padding: 20, borderRadius: 24 },
  previewEmoji: { fontSize: 56, lineHeight: 66 },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 26, lineHeight: 32 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
