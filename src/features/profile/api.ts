import { supabase } from '../../lib/supabase';

export async function updateMyAvatar(params: {
  userId: string;
  avatarUrl: string | null;
}): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: params.avatarUrl })
    .eq('id', params.userId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie udało się zapisać awatara.');
}

// Wgrywa zdjęcie do Storage (folder użytkownika) i zwraca jego publiczny adres
export async function uploadAvatarPhoto(params: {
  userId: string;
  uri: string;
  mimeType?: string | null;
}): Promise<string> {
  const isPng = params.mimeType === 'image/png';
  const contentType = isPng ? 'image/png' : 'image/jpeg';
  const path = `${params.userId}/avatar.${isPng ? 'png' : 'jpg'}`;

  const response = await fetch(params.uri);
  const body = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // ?v= wymusza odświeżenie zdjęcia, bo plik ma zawsze tę samą nazwę
  return `${data.publicUrl}?v=${Date.now()}`;
}
