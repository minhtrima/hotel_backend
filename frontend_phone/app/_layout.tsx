import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { HousekeepingProvider } from '@/src/contexts/HousekeepingContext';
import LoadingScreen from './loading';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Component để xử lý navigation dựa trên auth status
function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationRef = useRef(false);

  useEffect(() => {
    if (isLoading || navigationRef.current) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginScreen = segments[0] === 'login';

    if (isAuthenticated && !inAuthGroup) {
      // User đã đăng nhập, redirect to main app
      navigationRef.current = true;
      router.replace('/(tabs)');
      setTimeout(() => {
        navigationRef.current = false;
      }, 100);
    } else if (!isAuthenticated && inAuthGroup) {
      // User chưa đăng nhập, redirect to login
      navigationRef.current = true;
      router.replace('/login');
      setTimeout(() => {
        navigationRef.current = false;
      }, 100);
    } else if (!isAuthenticated && !inLoginScreen && segments.length === 0) {
      // App mới mở, user chưa đăng nhập
      navigationRef.current = true;
      router.replace('/login');
      setTimeout(() => {
        navigationRef.current = false;
      }, 100);
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <HousekeepingProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <InitialLayout />
          <StatusBar style="auto" />
        </ThemeProvider>
      </HousekeepingProvider>
    </AuthProvider>
  );
}
