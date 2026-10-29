// Gotowe awatary – zapisywane w profiles.avatar_url jako "preset:<key>"
export const PRESET_AVATARS: { key: string; emoji: string; label: string }[] = [
  { key: 'baby', emoji: '👶', label: 'Maluch' },
  { key: 'girl', emoji: '👧', label: 'Dziewczynka' },
  { key: 'boy', emoji: '👦', label: 'Chłopiec' },
  { key: 'teen', emoji: '🧑', label: 'Nastolatek' },
  { key: 'woman', emoji: '👩', label: 'Kobieta' },
  { key: 'man', emoji: '👨', label: 'Mężczyzna' },
  { key: 'grandma', emoji: '👵', label: 'Babcia' },
  { key: 'grandpa', emoji: '👴', label: 'Dziadek' },
  { key: 'dog', emoji: '🐶', label: 'Piesek' },
  { key: 'cat', emoji: '🐱', label: 'Kotek' },
  { key: 'rabbit', emoji: '🐰', label: 'Króliczek' },
  { key: 'fox', emoji: '🦊', label: 'Lis' },
  { key: 'bear', emoji: '🐻', label: 'Miś' },
  { key: 'panda', emoji: '🐼', label: 'Panda' },
  { key: 'unicorn', emoji: '🦄', label: 'Jednorożec' },
];

const PRESET_PREFIX = 'preset:';

export function presetValue(key: string): string {
  return `${PRESET_PREFIX}${key}`;
}

export type ParsedAvatar =
  | { type: 'preset'; emoji: string; key: string }
  | { type: 'photo'; uri: string }
  | { type: 'none' };

export function parseAvatar(avatarUrl: string | null | undefined): ParsedAvatar {
  if (!avatarUrl) return { type: 'none' };
  if (avatarUrl.startsWith(PRESET_PREFIX)) {
    const key = avatarUrl.slice(PRESET_PREFIX.length);
    const preset = PRESET_AVATARS.find((avatar) => avatar.key === key);
    return preset ? { type: 'preset', emoji: preset.emoji, key } : { type: 'none' };
  }
  if (avatarUrl.startsWith('http')) return { type: 'photo', uri: avatarUrl };
  return { type: 'none' };
}
