import { useAppTheme } from '../../lib/theme';

type MemberColor = { background: string; foreground: string; accent: string };

// Pastelowe pary kolorów dla awatarów (jasny motyw) – ciemny motyw odwraca je
const PALETTE: { soft: string; strong: string }[] = [
  { soft: '#FAD4C0', strong: '#9A4422' }, // brzoskwinia
  { soft: '#CFE8DF', strong: '#2C6A5B' }, // szałwia
  { soft: '#FBE3A8', strong: '#87600F' }, // miód
  { soft: '#DAD4F5', strong: '#4E4192' }, // lawenda
  { soft: '#F6CFDC', strong: '#93365A' }, // róż
  { soft: '#CDE3F5', strong: '#285D88' }, // niebo
  { soft: '#E3EBC4', strong: '#56691C' }, // oliwka
  { soft: '#F0D9CC', strong: '#7A4B35' }, // cynamon
];

// Ten sam użytkownik zawsze dostaje ten sam kolor
function paletteIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 2147483647;
  }
  return hash % PALETTE.length;
}

export function useMemberColor(userId: string | undefined): MemberColor {
  const theme = useAppTheme();
  const color = PALETTE[paletteIndex(userId ?? '')];

  return theme.dark
    ? { background: color.strong, foreground: color.soft, accent: color.soft }
    : { background: color.soft, foreground: color.strong, accent: color.strong };
}
