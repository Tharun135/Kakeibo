import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, color, size }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; size: number }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 16),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.4,
        },
        headerStyle: {
          backgroundColor: Colors.bg,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontWeight: '700',
          fontSize: 18,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <TabIcon name="plus-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: 'Weekly',
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar-week" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="monthly"
        options={{
          title: 'Monthly',
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar-month" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
