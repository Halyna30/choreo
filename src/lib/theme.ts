import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

// =============================================================
// Motywy Choreo: Elegancki, Rodzinny, Kolorowy – każdy w wersji jasnej i ciemnej
// =============================================================

export type ThemeName = 'elegant' | 'family' | 'kids';
export type ColorMode = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: { value: ThemeName; label: string; description: string; icon: string }[] =
  [
    {
      value: 'elegant',
      label: 'Elegancki',
      description: 'Grafit i gradient, stonowany i oficjalny',
      icon: 'briefcase-outline',
    },
    {
      value: 'family',
      label: 'Rodzinny',
      description: 'Szałwia i oliwka, jasny i łagodny',
      icon: 'leaf',
    },
    {
      value: 'kids',
      label: 'Kolorowy',
      description: 'Pastelowe kolory, wesoły dla dzieci',
      icon: 'palette-outline',
    },
  ];

export const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; icon: string }[] = [
  { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
  { value: 'light', label: 'Jasny', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Ciemny', icon: 'weather-night' },
];

// ---------- Czcionki ----------
export const NUNITO = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

const base = MD3LightTheme.fonts;

// Zaokrąglona Nunito dla motywów Rodzinny i Kolorowy
const nunitoFonts = configureFonts({
  config: {
    displayLarge: { ...base.displayLarge, fontFamily: NUNITO.extrabold },
    displayMedium: { ...base.displayMedium, fontFamily: NUNITO.extrabold },
    displaySmall: { ...base.displaySmall, fontFamily: NUNITO.extrabold },
    headlineLarge: { ...base.headlineLarge, fontFamily: NUNITO.extrabold },
    headlineMedium: { ...base.headlineMedium, fontFamily: NUNITO.extrabold },
    headlineSmall: { ...base.headlineSmall, fontFamily: NUNITO.bold },
    titleLarge: { ...base.titleLarge, fontFamily: NUNITO.bold },
    titleMedium: { ...base.titleMedium, fontFamily: NUNITO.bold },
    titleSmall: { ...base.titleSmall, fontFamily: NUNITO.bold },
    labelLarge: { ...base.labelLarge, fontFamily: NUNITO.bold },
    labelMedium: { ...base.labelMedium, fontFamily: NUNITO.semibold },
    labelSmall: { ...base.labelSmall, fontFamily: NUNITO.semibold },
    bodyLarge: { ...base.bodyLarge, fontFamily: NUNITO.regular },
    bodyMedium: { ...base.bodyMedium, fontFamily: NUNITO.regular },
    bodySmall: { ...base.bodySmall, fontFamily: NUNITO.regular },
  },
});

// ---------- Typy ----------
type ExtraColors = {
  success: string;
  onSuccess: string;
  successContainer: string;
  warning: string;
  star: string;
};

// Dekoracyjne „plamy” w tle ekranów powitalnych
export type Blob = {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity: number;
};

type Brand = {
  name: ThemeName;
  // gradient na głównych przyciskach (null = jednolity kolor)
  buttonGradient: [string, string] | null;
  blobs: Blob[];
  // kolor listka przy logo
  leaf: string | null;
  titleColor: string;
};

export type AppTheme = Omit<MD3Theme, 'colors'> & {
  colors: MD3Theme['colors'] & ExtraColors;
  brand: Brand;
};

type Palette = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  success: string;
  onSuccess: string;
  successContainer: string;
  warning: string;
  star: string;
};

type Variant = { palette: Palette; brand: Omit<Brand, 'name'> };

// ---------- Palety ----------
const VARIANTS: Record<ThemeName, { light: Variant; dark: Variant }> = {
  // Elegancki: grafit + niebiesko-fioletowy gradient
  elegant: {
    dark: {
      palette: {
        primary: '#7C8BFF',
        onPrimary: '#0B1250',
        primaryContainer: '#2F3A8F',
        onPrimaryContainer: '#E0E3FF',
        secondary: '#B9A6F5',
        onSecondary: '#2A1A63',
        secondaryContainer: '#4A3D7A',
        onSecondaryContainer: '#EBE3FF',
        tertiary: '#7FD1E0',
        onTertiary: '#00363F',
        tertiaryContainer: '#1D5560',
        onTertiaryContainer: '#C8F2FA',
        background: '#373C42',
        onBackground: '#EEF0F3',
        surface: '#42484F',
        onSurface: '#EEF0F3',
        surfaceVariant: '#4C535B',
        onSurfaceVariant: '#BCC3CC',
        outline: '#7D8692',
        outlineVariant: '#555D66',
        success: '#6FD3A8',
        onSuccess: '#00382A',
        successContainer: '#1E5644',
        warning: '#F5C46B',
        star: '#F7C65A',
      },
      brand: {
        buttonGradient: ['#2F49F5', '#B63CE6'],
        blobs: [],
        leaf: '#8FD3A6',
        titleColor: '#F4F5F7',
      },
    },
    light: {
      palette: {
        primary: '#3446E0',
        onPrimary: '#FFFFFF',
        primaryContainer: '#DFE3FF',
        onPrimaryContainer: '#0F1A6E',
        secondary: '#6B4FD1',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#E8E0FF',
        onSecondaryContainer: '#25125F',
        tertiary: '#137A8C',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#C8EEF5',
        onTertiaryContainer: '#003640',
        background: '#F1F3F6',
        onBackground: '#1E2227',
        surface: '#FFFFFF',
        onSurface: '#1E2227',
        surfaceVariant: '#E6E9EE',
        onSurfaceVariant: '#5B636D',
        outline: '#A9B0BA',
        outlineVariant: '#DCE0E6',
        success: '#1F8A63',
        onSuccess: '#FFFFFF',
        successContainer: '#CDEFE0',
        warning: '#B7791F',
        star: '#E5A52A',
      },
      brand: {
        buttonGradient: ['#2F49F5', '#B63CE6'],
        blobs: [],
        leaf: '#3C9A62',
        titleColor: '#1E2227',
      },
    },
  },

  // Rodzinny: szałwia, oliwka, leśna zieleń
  family: {
    light: {
      palette: {
        primary: '#2F5D3A',
        onPrimary: '#FFFFFF',
        primaryContainer: '#D3E4CF',
        onPrimaryContainer: '#0E2A14',
        secondary: '#6F7E3C',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#E4EAC6',
        onSecondaryContainer: '#252E05',
        tertiary: '#A8743A',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#F6E2C8',
        onTertiaryContainer: '#3A2200',
        background: '#E6EBDF',
        onBackground: '#1E2A20',
        surface: '#F6F8F2',
        onSurface: '#1E2A20',
        surfaceVariant: '#DDE4D5',
        onSurfaceVariant: '#56645A',
        outline: '#97A593',
        outlineVariant: '#CBD5C5',
        success: '#2F7A45',
        onSuccess: '#FFFFFF',
        successContainer: '#CDE8D2',
        warning: '#A8743A',
        star: '#D9A23A',
      },
      brand: {
        buttonGradient: null,
        blobs: [
          { color: '#B9C59E', size: 380, top: -140, left: -160, opacity: 0.55 },
          { color: '#9FAE7C', size: 300, bottom: -120, right: -130, opacity: 0.45 },
        ],
        leaf: '#3F7A47',
        titleColor: '#24432B',
      },
    },
    dark: {
      palette: {
        primary: '#9FD0A4',
        onPrimary: '#06361A',
        primaryContainer: '#22502D',
        onPrimaryContainer: '#D3E4CF',
        secondary: '#C2CD8E',
        onSecondary: '#2C3404',
        secondaryContainer: '#444E1A',
        onSecondaryContainer: '#E4EAC6',
        tertiary: '#E6BE8A',
        onTertiary: '#432C00',
        tertiaryContainer: '#62441A',
        onTertiaryContainer: '#F6E2C8',
        background: '#18201A',
        onBackground: '#E3EADF',
        surface: '#212A23',
        onSurface: '#E3EADF',
        surfaceVariant: '#2C362E',
        onSurfaceVariant: '#B8C4B6',
        outline: '#83907F',
        outlineVariant: '#3A453B',
        success: '#8FD09E',
        onSuccess: '#003919',
        successContainer: '#1F5130',
        warning: '#E6BE8A',
        star: '#F0C060',
      },
      brand: {
        buttonGradient: null,
        blobs: [
          { color: '#3E4E33', size: 380, top: -140, left: -160, opacity: 0.6 },
          { color: '#334127', size: 300, bottom: -120, right: -130, opacity: 0.6 },
        ],
        leaf: '#9FD0A4',
        titleColor: '#DCEAD8',
      },
    },
  },

  // Kolorowy: pastele w dzień, neonowy granat w nocy
  kids: {
    light: {
      palette: {
        primary: '#2633C9',
        onPrimary: '#FFFFFF',
        primaryContainer: '#DDE1FF',
        onPrimaryContainer: '#0A1166',
        secondary: '#D94A8A',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#FFD8E8',
        onSecondaryContainer: '#4F0A2B',
        tertiary: '#E28A00',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#FFE3B5',
        onTertiaryContainer: '#432900',
        background: '#EEF2FA',
        onBackground: '#1B1F5E',
        surface: '#FFFFFF',
        onSurface: '#1B1F5E',
        surfaceVariant: '#E6EAF6',
        onSurfaceVariant: '#5A5F86',
        outline: '#A5ABCC',
        outlineVariant: '#DCE1F0',
        success: '#18A06A',
        onSuccess: '#FFFFFF',
        successContainer: '#C9F2DE',
        warning: '#E28A00',
        star: '#FFB627',
      },
      brand: {
        buttonGradient: null,
        blobs: [
          { color: '#F7BFD3', size: 300, top: -90, left: -120, opacity: 0.75 },
          { color: '#B9D5F7', size: 320, top: 260, right: -150, opacity: 0.75 },
          { color: '#F9C9D8', size: 260, bottom: -110, right: -40, opacity: 0.7 },
        ],
        leaf: null,
        titleColor: '#1B1F6B',
      },
    },
    dark: {
      palette: {
        primary: '#8E86FF',
        onPrimary: '#140C6B',
        primaryContainer: '#2D2A8A',
        onPrimaryContainer: '#E2DFFF',
        secondary: '#F78FD0',
        onSecondary: '#5C0A3F',
        secondaryContainer: '#7A2460',
        onSecondaryContainer: '#FFD8EE',
        tertiary: '#5FD4F5',
        onTertiary: '#00394A',
        tertiaryContainer: '#14526A',
        onTertiaryContainer: '#C4F0FF',
        background: '#0E1038',
        onBackground: '#F0EFFF',
        surface: '#191C4F',
        onSurface: '#F0EFFF',
        surfaceVariant: '#24275F',
        onSurfaceVariant: '#B9BAE3',
        outline: '#6E70B8',
        outlineVariant: '#2E3170',
        success: '#5EE0A6',
        onSuccess: '#00391F',
        successContainer: '#145C3E',
        warning: '#FFC861',
        star: '#FFCF4D',
      },
      brand: {
        buttonGradient: ['#3D5AFE', '#C64BFF'],
        blobs: [
          { color: '#3A6BFF', size: 300, top: -80, left: -130, opacity: 0.45 },
          { color: '#B23BFF', size: 260, bottom: 80, right: -120, opacity: 0.4 },
        ],
        leaf: '#B58CFF',
        titleColor: '#F4F2FF',
      },
    },
  },
};

export function buildTheme(name: ThemeName, dark: boolean): AppTheme {
  const baseTheme = dark ? MD3DarkTheme : MD3LightTheme;
  const variant = VARIANTS[name][dark ? 'dark' : 'light'];
  const p = variant.palette;

  return {
    ...baseTheme,
    dark,
    roundness: name === 'elegant' ? 3 : 5,
    // Elegancki zostaje przy czcionce systemowej, pozostałe dostają Nunito
    fonts: name === 'elegant' ? baseTheme.fonts : nunitoFonts,
    colors: {
      ...baseTheme.colors,
      ...p,
      elevation: {
        level0: 'transparent',
        level1: p.surface,
        level2: p.surface,
        level3: p.surfaceVariant,
        level4: p.surfaceVariant,
        level5: p.surfaceVariant,
      },
    },
    brand: { name, ...variant.brand },
  };
}

// useTheme z naszymi dodatkowymi kolorami i ustawieniami marki
export const useAppTheme = () => useTheme<AppTheme>();

// Rodzina czcionki pogrubionej aktualnego motywu (np. do nagłówków nawigacji)
export function boldFont(theme: AppTheme): string | undefined {
  return theme.fonts.titleMedium.fontFamily;
}
