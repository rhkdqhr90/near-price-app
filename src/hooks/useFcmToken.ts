import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user.api';

export const useFcmToken = () => {
  const userId = useAuthStore(s => s.user?.id);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCancelled = false;
    let unsubscribeRefresh: (() => void) | undefined;

    const registerToken = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled || isCancelled) return;

      const token = await messaging().getToken();
      if (token && !isCancelled) {
        await userApi.updateFcmToken(userId, token).catch(() => {});
      }

      if (!isCancelled) {
        unsubscribeRefresh = messaging().onTokenRefresh(async (newToken) => {
          await userApi.updateFcmToken(userId, newToken).catch(() => {});
        });
      }
    };

    registerToken().catch(() => {});

    return () => {
      isCancelled = true;
      unsubscribeRefresh?.();
    };
  }, [isAuthenticated, userId]);
};
