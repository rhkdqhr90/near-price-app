import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

const requestAndroidPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.CAMERA,
  ]);
};

export const useAppPermissions = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    }
  }, []);
};
