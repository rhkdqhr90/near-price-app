import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import OnboardingIntroScreen from '../screens/onboarding/OnboardingIntroScreen';
import PermissionScreen from '../screens/onboarding/PermissionScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
    <Stack.Screen name="Permission" component={PermissionScreen} />
  </Stack.Navigator>
);

export default OnboardingNavigator;
