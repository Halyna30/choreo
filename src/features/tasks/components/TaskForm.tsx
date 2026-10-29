import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { GradientButton } from '../../../components/GradientButton';
import { MemberAvatar } from '../../../components/MemberAvatar';
import { getMemberName } from '../../groups/roles';
import type { GroupMember } from '../../groups/types';
import { formatFullDate } from '../dates';
import type { RepeatMode, TaskAssignment, TaskFormValues } from '../types';
import { WEEKDAYS, describeWeekdays, weekdaysFromForm } from '../weekdays';
import { DaySwitcher } from './DaySwitcher';

type Props = {
  initialValues: TaskFormValues;
  members: GroupMember[];
  submitLabel: string;
  loading: boolean;
  serverError?: string | null;
  // optional = można wybrać powtarzanie, required = edycja szablonu, hidden = jeden dzień
  repeatMode?: 'optional' | 'required' | 'hidden';
  onSubmit: (values: TaskFormValues) => void;
};

const REPEAT_BUTTONS: { value: RepeatMode; label: string; icon: string }[] = [
  { value: 'none', label: 'Raz', icon: 'numeric-1-circle-outline' },
  { value: 'daily', label: 'Codziennie', icon: 'repeat' },
  { value: 'weekdays', label: 'Wybrane dni', icon: 'calendar-week' },
];

const MULTI_HINTS: Record<Exclude<TaskAssignment, 'single'>, string> = {
  anyone: 'Zadanie przejmuje osoba, która pierwsza je zacznie. Nagrodę dostaje ona.',
  together: 'Jedno wspólne zadanie – po zrobieniu nagrodę dostaje każdy uczestnik.',
};

export function TaskForm({
  initialValues,
  members,
  submitLabel,
  loading,
  serverError,
  repeatMode = 'hidden',
  onSubmit,
}: Props) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isRepeating = values.repeat !== 'none';
  const isMulti = values.assigneeIds.length > 1;

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleAssignee(userId: string) {
    setValues((current) => {
      const assigneeIds = current.assigneeIds.includes(userId)
        ? current.assigneeIds.filter((id) => id !== userId)
        : [...current.assigneeIds, userId];
      // jedna osoba = zwykłe zadanie; przy kilku domyślnie "ktokolwiek"
      const assignment: TaskAssignment =
        assigneeIds.length <= 1
          ? 'single'
          : current.assignment === 'single'
            ? 'anyone'
            : current.assignment;
      return { ...current, assigneeIds, assignment };
    });
  }

  function toggleWeekday(day: number) {
    setValues((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day],
    }));
  }

  function handleSubmit() {
    if (!values.title.trim()) {
      setValidationError('Wpisz nazwę zadania.');
      return;
    }
    if (values.assigneeIds.length === 0) {
      setValidationError('Wybierz, dla kogo jest zadanie.');
      return;
    }
    if (values.repeat === 'weekdays' && values.weekdays.length === 0) {
      setValidationError('Wybierz co najmniej jeden dzień tygodnia.');
      return;
    }
    setValidationError(null);
    onSubmit(values);
  }

  const error = validationError ?? serverError ?? null;
  const repeatButtons =
    repeatMode === 'required'
      ? REPEAT_BUTTONS.filter((button) => button.value !== 'none')
      : REPEAT_BUTTONS;

  return (
    <View style={styles.form}>
      <TextInput
        label="Zadanie"
        placeholder="np. Wynieść śmieci"
        mode="outlined"
        value={values.title}
        onChangeText={(text) => update('title', text)}
        maxLength={200}
      />
      <TextInput
        label="Opis (opcjonalnie)"
        mode="outlined"
        value={values.description}
        onChangeText={(text) => update('description', text)}
        multiline
        numberOfLines={3}
      />

      <Text variant="labelLarge" style={styles.label}>
        Dla kogo (możesz wybrać kilka osób)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {members.map((member) => {
          const selected = values.assigneeIds.includes(member.user_id);
          const name = getMemberName(member);
          return (
            <Chip
              key={member.user_id}
              selected={selected}
              showSelectedCheck
              mode={selected ? 'flat' : 'outlined'}
              onPress={() => toggleAssignee(member.user_id)}
              avatar={
                <MemberAvatar
                  userId={member.user_id}
                  name={name}
                  avatarUrl={member.profile?.avatar_url}
                  size={24}
                />
              }
            >
              {name}
            </Chip>
          );
        })}
      </ScrollView>

      {isMulti ? (
        <>
          <SegmentedButtons
            value={values.assignment}
            onValueChange={(value) => update('assignment', value as TaskAssignment)}
            buttons={[
              { value: 'anyone', label: 'Ktokolwiek', icon: 'account-question' },
              { value: 'together', label: 'Wszyscy razem', icon: 'account-group' },
            ]}
          />
          {values.assignment !== 'single' ? (
            <HelperText type="info">{MULTI_HINTS[values.assignment]}</HelperText>
          ) : null}
        </>
      ) : null}

      {repeatMode !== 'hidden' ? (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Powtarzanie
          </Text>
          <SegmentedButtons
            value={values.repeat}
            onValueChange={(value) => update('repeat', value as RepeatMode)}
            buttons={repeatButtons}
          />
          {values.repeat === 'weekdays' ? (
            <View style={styles.weekdays}>
              {WEEKDAYS.map((day) => (
                <Chip
                  key={day.value}
                  selected={values.weekdays.includes(day.value)}
                  mode={values.weekdays.includes(day.value) ? 'flat' : 'outlined'}
                  onPress={() => toggleWeekday(day.value)}
                  compact
                >
                  {day.short}
                </Chip>
              ))}
            </View>
          ) : null}
          {isRepeating && (values.repeat === 'daily' || values.weekdays.length > 0) ? (
            <HelperText type="info">
              🔁 {describeWeekdays(weekdaysFromForm(values))}. Każdy dzień ma osobny status.
            </HelperText>
          ) : null}
        </>
      ) : null}

      <Text variant="labelLarge" style={styles.label}>
        {isRepeating ? 'Od kiedy' : 'Kiedy'}
      </Text>
      <DaySwitcher value={values.dueDate} onChange={(date) => update('dueDate', date)} />
      <Text variant="bodySmall" style={styles.fullDate}>
        {formatFullDate(values.dueDate)}
      </Text>

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>

      <GradientButton onPress={handleSubmit} loading={loading} disabled={loading}>
        {submitLabel}
      </GradientButton>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  label: { marginTop: 8 },
  chips: { gap: 8, paddingVertical: 4 },
  weekdays: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fullDate: { textAlign: 'center' },
});
