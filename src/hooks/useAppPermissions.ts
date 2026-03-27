import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

const requestAndroidPermissions = () => {
  PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.CAMERA,
  ]).catch(() => {
    // 권한 요청 실패 — 각 기능 진입 시 재요청됨
  });
};

export const useAppPermissions = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    }
  }, []);
};
