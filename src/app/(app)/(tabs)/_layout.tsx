import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useCurrentMembership } from '../../../features/groups/hooks';
import { useTasksRealtime } from '../../../features/tasks/hooks';
import { useTabOptions } from '../../../lib/navigation';

export default function TabsLayout() {
  const tabOptions = useTabOptions();
  const { data: membership } = useCurrentMembership();

  // Jedna subskrypcja Realtime dla całej aplikacji
  useTasksRealtime(membership?.group_id);

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Moje zadania',
          tabBarLabel: 'Dziś',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'calendar-check' : 'calendar-check-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: membership?.group.name ?? 'Grupa',
          tabBarLabel: 'Grupa',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-group' : 'account-group-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
