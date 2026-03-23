import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/auth/LoginScreen';
import LocationSetupScreen from '../screens/auth/LocationSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // 로그인은 됐지만 동네 미설정 → LocationSetup 바로 진입
        <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthStack;
