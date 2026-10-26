import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { getMemberName } from '../../groups/roles';
import type { GroupMember } from '../../groups/types';
import { formatFullDate } from '../dates';
import type { RepeatMode, TaskFormValues } from '../types';
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

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
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
    if (!values.assignedTo) {
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
        Dla kogo
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {members.map((member) => (
          <Chip
            key={member.user_id}
            selected={values.assignedTo === member.user_id}
            showSelectedCheck
            mode={values.assignedTo === member.user_id ? 'flat' : 'outlined'}
            onPress={() => update('assignedTo', member.user_id)}
          >
            {getMemberName(member)}
          </Chip>
        ))}
      </ScrollView>

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

      <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}>
        {submitLabel}
      </Button>
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
