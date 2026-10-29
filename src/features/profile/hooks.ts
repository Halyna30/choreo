import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { updateMyAvatar, uploadAvatarPhoto } from './api';

function useInvalidateProfiles() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['group-members'] });
    await queryClient.invalidateQueries({ queryKey: ['memberships'] });
  };
}

// Ustawia gotowy awatar ("preset:...") albo usuwa awatar (null)
export function useSetAvatar() {
  const { session } = useAuth();
  const invalidate = useInvalidateProfiles();

  return useMutation({
    mutationFn: (avatarUrl: string | null) =>
      updateMyAvatar({ userId: session?.user.id as string, avatarUrl }),
    onSuccess: () => invalidate(),
  });
}

// Wgrywa zdjęcie i zapisuje jego adres w profilu
export function useUploadAvatar() {
  const { session } = useAuth();
  const invalidate = useInvalidateProfiles();

  return useMutation({
    mutationFn: async (photo: { uri: string; mimeType?: string | null }) => {
      const userId = session?.user.id as string;
      const avatarUrl = await uploadAvatarPhoto({ userId, ...photo });
      await updateMyAvatar({ userId, avatarUrl });
    },
    onSuccess: () => invalidate(),
  });
}
