import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, ProgressBar, Text } from 'react-native-paper';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SectionCard } from '../../../components/SectionCard';
import { toUserMessage } from '../../../lib/errors';
import { plural } from '../../../lib/plural';
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

export function starsLabel(count: number): string {
  return `${count} ${plural(count, 'gwiazdka', 'gwiazdki', 'gwiazdek')}`;
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
              Nagroda wręczona
            </Button>
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.success }}>
              Cel osiągnięty! Poproś rodzica o nagrodę 🎉
            </Text>
          )
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Jeszcze {starsLabel(goal.stars_needed - stars)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Cele z gwiazdkami: postęp, dodawanie (dziecko) i wręczanie nagród (rodzic)
export function GoalsSection({ groupId, userId, stars, isOwn, canRedeem, ownerName }: Props) {
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
    <SectionCard title={isOwn ? 'Moje cele' : `Cele: ${ownerName ?? ''}`}>
      <View style={styles.list}>
        {active.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            {isOwn
              ? 'Wymyśl, na co zbierasz gwiazdki – np. kino, lody albo nowa gra 🎯'
              : 'Brak aktywnych celów.'}
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
              {goal.emoji} {goal.title} – wręczone 🎉
            </Text>
          </View>
        ))}

        <HelperText type="error" visible={Boolean(redeemGoal.error)}>
          {redeemGoal.error ? toUserMessage(redeemGoal.error) : null}
        </HelperText>

        {isOwn ? (
          <Button
            mode="contained-tonal"
            icon="target"
            onPress={() => router.push('/goal/edit')}
            style={styles.add}
          >
            Nowy cel
          </Button>
        ) : null}
      </View>

      <ConfirmDialog
        visible={Boolean(toRedeem)}
        title="Wręczyć nagrodę?"
        message={
          toRedeem
            ? `„${toRedeem.emoji} ${toRedeem.title}” – od salda odejmie się ${starsLabel(toRedeem.stars_needed)}.`
            : ''
        }
        confirmLabel="Wręczam 🎁"
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
