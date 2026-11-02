import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, ProgressBar, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SectionCard } from '../../../components/SectionCard';
import { toUserMessage } from '../../../lib/errors';
import { useAppTheme } from '../../../lib/theme';
import type { Goal } from '../api';
import { useGoals, useRedeemGoal } from '../hooks';

type Props = {
  groupId: string;
  userId: string;
  stars: number;
  isOwn: boolean; // właściciel celów może je dodawać i edytować
  canRedeem: boolean; // rodzic może wręczyć nagrodę
  ownerName?: string;
};

export function starsLabel(count: number, t: TFunction): string {
  return t('rewards.stars', { count });
}

function GoalRow({
  goal,
  stars,
  isOwn,
  canRedeem,
  onRedeem,
}: {
  goal: Goal;
  stars: number;
  isOwn: boolean;
  canRedeem: boolean;
  onRedeem: (goal: Goal) => void;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const progress = Math.min(stars / goal.stars_needed, 1);
  const reached = stars >= goal.stars_needed;

  return (
    <Pressable
      disabled={!isOwn}
      onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal.id } })}
      style={styles.goal}
    >
      <View style={[styles.emoji, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Text style={styles.emojiText}>{goal.emoji}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.goalHeader}>
          <Text variant="titleMedium" numberOfLines={1} style={styles.flex}>
            {goal.title}
          </Text>
          <Text variant="labelLarge" style={{ color: theme.colors.tertiary }}>
            {Math.min(stars, goal.stars_needed)}/{goal.stars_needed} ⭐
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={reached ? theme.colors.success : theme.colors.star}
          style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
        />
        {reached ? (
          canRedeem ? (
            <Button
              mode="contained"
              compact
              icon="gift"
              style={styles.redeem}
              onPress={() => onRedeem(goal)}
            >
              {t('goals.rewardGiven')}
            </Button>
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.success }}>
              {t('goals.reached')}
            </Text>
          )
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('goals.remaining', { stars: starsLabel(goal.stars_needed - stars, t) })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Cele z gwiazdkami: postęp, dodawanie (dziecko) i wręczanie nagród (rodzic)
export function GoalsSection({ groupId, userId, stars, isOwn, canRedeem, ownerName }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data: goals } = useGoals(groupId);
  const redeemGoal = useRedeemGoal(groupId);
  const [toRedeem, setToRedeem] = useState<Goal | null>(null);

  const mine = (goals ?? []).filter((goal) => goal.user_id === userId);
  const active = mine.filter((goal) => goal.status === 'active');
  const redeemed = mine
    .filter((goal) => goal.status === 'redeemed')
    .sort((a, b) => (b.redeemed_at ?? '').localeCompare(a.redeemed_at ?? ''))
    .slice(0, 3);

  if (!isOwn && active.length === 0 && redeemed.length === 0) return null;

  return (
    <SectionCard title={isOwn ? t('goals.mine') : t('goals.of', { name: ownerName ?? '' })}>
      <View style={styles.list}>
        {active.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            {isOwn ? t('goals.emptyOwn') : t('goals.empty')}
          </Text>
        ) : null}

        {active.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            stars={stars}
            isOwn={isOwn}
            canRedeem={canRedeem}
            onRedeem={setToRedeem}
          />
        ))}

        {redeemed.map((goal) => (
          <View key={goal.id} style={styles.redeemedRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('goals.redeemed', { goal: `${goal.emoji} ${goal.title}` })}
            </Text>
          </View>
        ))}

        <HelperText type="error" visible={Boolean(redeemGoal.error)}>
          {redeemGoal.error ? toUserMessage(redeemGoal.error, t) : null}
        </HelperText>

        {isOwn ? (
          <Button
            mode="contained-tonal"
            icon="target"
            onPress={() => router.push('/goal/edit')}
            style={styles.add}
          >
            {t('goals.new')}
          </Button>
        ) : null}
      </View>

      <ConfirmDialog
        visible={Boolean(toRedeem)}
        title={t('goals.confirmRedeem')}
        message={
          toRedeem
            ? t('goals.redeemMessage', {
                goal: `${toRedeem.emoji} ${toRedeem.title}`,
                stars: starsLabel(toRedeem.stars_needed, t),
              })
            : ''
        }
        confirmLabel={t('goals.redeemConfirm')}
        loading={redeemGoal.isPending}
        onConfirm={() =>
          toRedeem &&
          redeemGoal.mutate(toRedeem.id, { onSettled: () => setToRedeem(null) })
        }
        onDismiss={() => setToRedeem(null)}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 12, gap: 14 },
  empty: { textAlign: 'center', paddingVertical: 8 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 26, lineHeight: 32 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progress: { height: 10, borderRadius: 5, marginBottom: 4 },
  redeem: { alignSelf: 'flex-start', marginTop: 4 },
  redeemedRow: { paddingLeft: 4 },
  add: { marginTop: 4 },
});
