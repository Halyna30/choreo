import type { pl } from '../../i18n/locales/pl';

export type PresetKey = keyof typeof pl.avatar.presets;

// Gotowe awatary – zapisywane w profiles.avatar_url jako "preset:<key>".
// Nazwy postaci są w tłumaczeniach: avatar.presets.<key>
export const PRESET_AVATARS: { key: PresetKey; emoji: string }[] = [
  { key: 'baby', emoji: '👶' },
  { key: 'girl', emoji: '👧' },
  { key: 'boy', emoji: '👦' },
  { key: 'teen', emoji: '🧑' },
  { key: 'woman', emoji: '👩' },
  { key: 'man', emoji: '👨' },
  { key: 'grandma', emoji: '👵' },
  { key: 'grandpa', emoji: '👴' },
  { key: 'dog', emoji: '🐶' },
  { key: 'cat', emoji: '🐱' },
  { key: 'rabbit', emoji: '🐰' },
  { key: 'fox', emoji: '🦊' },
  { key: 'bear', emoji: '🐻' },
  { key: 'panda', emoji: '🐼' },
  { key: 'unicorn', emoji: '🦄' },
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
