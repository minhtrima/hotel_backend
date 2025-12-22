import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Alert, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { useHousekeeping } from '@/src/contexts/HousekeepingContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout, user } = useAuth();
  const { tasks } = useHousekeeping();
  const filteredTasks = tasks?.filter((task) => task.status === 'pending');
  const taskCount = filteredTasks ? filteredTasks.length : 0;

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerTitle: `Xin chào, ${user?.name || 'User'}`,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 15, padding: 5 }}
          >
            <IconSymbol size={24} name="power" color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Công việc',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="clipboard-list" size={28} color={color} />
              {taskCount > 0 && (
                <View style={{ position: 'absolute', top: -6, right: -8, backgroundColor: 'red', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{taskCount > 99 ? '99+' : taskCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Vật tư',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="package-variant" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="issue"
        options={{
          title: 'Báo cáo sự cố',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.triangle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cccd-scan"
        options={{
          title: 'Quét CCCD',
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
