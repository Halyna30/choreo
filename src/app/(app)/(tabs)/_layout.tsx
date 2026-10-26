import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { useCurrentMembership } from '../../../features/groups/hooks';
import { useTasksRealtime } from '../../../features/tasks/hooks';

export default function TabsLayout() {
  const theme = useTheme();
  const { data: membership } = useCurrentMembership();

  // Jedna subskrypcja Realtime dla całej aplikacji
  useTasksRealtime(membership?.group_id);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.colors.primary }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Moje zadania',
          tabBarLabel: 'Dziś',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-today" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: membership?.group.name ?? 'Grupa',
          tabBarLabel: 'Grupa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
