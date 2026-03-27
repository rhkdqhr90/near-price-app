import { useEffect, useCallback } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { userApi } from '../api/user.api';

/**
 * FCM 토큰 관리 + 알림 권한 요청 + 포그라운드 알림 처리
 * MainTabNavigator에서 호출 (로그인 후)
 */
export const useFCM = () => {
  const user = useAuthStore((s) => s.user);
  const setAllNotifications = useNotificationStore((s) => s.setAllNotifications);

  const saveFcmToken = useCallback(async (token: string) => {
    if (!user?.id) return;
    try {
      await userApi.updateFcmToken(user.id, token);
    } catch {
      // 실패해도 앱 동작에 영향 없음
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const setup = async () => {
      // 1. OS 알림 권한 확인/요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      // OS 권한 상태를 store에 반영 (권한 거부 시 앱 내 알림도 OFF)
      if (!enabled) {
        setAllNotifications(false);
        return;
      }

      // 2. FCM 토큰 가져오기 & 서버 저장
      try {
        const token = await messaging().getToken();
        await saveFcmToken(token);
      } catch {
        // 토큰 실패 — 무시
      }

      // 3. 토큰 갱신
      const unsubToken = messaging().onTokenRefresh(async (newToken) => {
        await saveFcmToken(newToken);
      });

      // 4. 포그라운드 알림
      const unsubMessage = messaging().onMessage(async (remoteMessage) => {
        const title = remoteMessage.notification?.title ?? '알림';
        const body = remoteMessage.notification?.body ?? '';
        Alert.alert(title, body);
      });

      return () => {
        unsubToken();
        unsubMessage();
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => { cleanup = fn; });

    return () => { cleanup?.(); };
  }, [user?.id, saveFcmToken, setAllNotifications]);
};
