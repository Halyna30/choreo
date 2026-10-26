import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { getMemberName } from '../../groups/roles';
import type { GroupMember } from '../../groups/types';
import { formatFullDate } from '../dates';
import type { TaskFormValues } from '../types';
import { DaySwitcher } from './DaySwitcher';

type Props = {
  initialValues: TaskFormValues;
  members: GroupMember[];
  submitLabel: string;
  loading: boolean;
  serverError?: string | null;
  onSubmit: (values: TaskFormValues) => void;
};

export function TaskForm({
  initialValues,
  members,
  submitLabel,
  loading,
  serverError,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [validationError, setValidationError] = useState<string | null>(null);

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
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
    setValidationError(null);
    onSubmit(values);
  }

  const error = validationError ?? serverError ?? null;

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

      <Text variant="labelLarge" style={styles.label}>
        Kiedy
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
  fullDate: { textAlign: 'center' },
});
