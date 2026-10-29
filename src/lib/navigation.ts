import { boldFont, useAppTheme } from './theme';

// Kolory nagłówków, tła ekranów i paska zakładek zgodne z wybranym motywem
export function useStackOptions() {
  const theme = useAppTheme();
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.onBackground,
    headerTitleStyle: { fontFamily: boldFont(theme) },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  };
}

export function useTabOptions() {
  const theme = useAppTheme();
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.onBackground,
    headerTitleStyle: { fontFamily: boldFont(theme) },
    headerShadowVisible: false,
    sceneStyle: { backgroundColor: theme.colors.background },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.outlineVariant,
    },
    tabBarLabelStyle: { fontFamily: boldFont(theme) },
  };
}
