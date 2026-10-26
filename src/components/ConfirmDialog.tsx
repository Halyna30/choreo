import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onDismiss,
}: Props) {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            Anuluj
          </Button>
          <Button
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            textColor={destructive ? theme.colors.error : undefined}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
