import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useCurrentMembership } from '../../../features/groups/hooks';
import { useTasksRealtime } from '../../../features/tasks/hooks';
import { useTabOptions } from '../../../lib/navigation';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Ikona zakładki: pełna, gdy zakładka jest aktywna, w przeciwnym razie obrys.
// Nawigacja podaje kolor jako ColorValue, a ikona przyjmuje tylko tekst.
function tabIcon(name: IconName, outlineName: IconName) {
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return (
      <MaterialCommunityIcons
        name={focused ? name : outlineName}
        color={typeof color === 'string' ? color : undefined}
        size={size}
      />
    );
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const tabOptions = useTabOptions();
  const { data: membership } = useCurrentMembership();

  // Jedna subskrypcja Realtime dla całej aplikacji
  useTasksRealtime(membership?.group_id);

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.myTasks'),
          tabBarLabel: t('nav.today'),
          tabBarIcon: tabIcon('calendar-check', 'calendar-check-outline'),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: membership?.group.name ?? t('nav.group'),
          tabBarLabel: t('nav.group'),
          tabBarIcon: tabIcon('account-group', 'account-group-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: tabIcon('account-circle', 'account-circle-outline'),
        }}
      />
    </Tabs>
  );
}
