import { Linking, Alert, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useLocationStore } from '../store/locationStore';

interface CurrentLocation {
  latitude: number;
  longitude: number;
}

// 길찾기 대상 지도 앱. 설치된 앱만 선택 UI에 노출.
interface MapApp {
  name: string;
  appUrl: (
    lat: number,
    lng: number,
    name: string,
    currentLocation: CurrentLocation | null,
  ) => string;
  webUrl: (
    lat: number,
    lng: number,
    name: string,
    currentLocation: CurrentLocation | null,
  ) => string;
  canOpenUrls: string[];
}

const getStoredLocation = (): CurrentLocation | null => {
  const { latitude, longitude } = useLocationStore.getState();
  if (latitude === null || longitude === null) {
    return null;
  }
  return { latitude, longitude };
};

const resolveCurrentLocation = async (): Promise<CurrentLocation | null> => {
  return await new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(getStoredLocation()),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 3000,
        forceRequestLocation: true,
      },
    );
  });
};

const MAP_APPS: MapApp[] = [
  {
    name: '네이버 지도',
    appUrl: (lat, lng, name, currentLocation) => {
      const destinationName = encodeURIComponent(name);
      if (!currentLocation) {
        return `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${destinationName}&appname=com.nearpriceapp`;
      }
      return `nmap://route/walk?slat=${currentLocation.latitude}&slng=${currentLocation.longitude}&sname=${encodeURIComponent('현재 위치')}&dlat=${lat}&dlng=${lng}&dname=${destinationName}&appname=com.nearpriceapp`;
    },
    webUrl: (lat, lng, name, currentLocation) => {
      const destinationName = encodeURIComponent(name);
      if (!currentLocation) {
        return `https://map.naver.com/v5/directions/-/${lng},${lat},${destinationName}/-/walk`;
      }
      return `https://map.naver.com/v5/directions/${currentLocation.longitude},${currentLocation.latitude},${encodeURIComponent('현재 위치')}/${lng},${lat},${destinationName}/-/walk`;
    },
    canOpenUrls: ['nmap://'],
  },
  {
    name: '카카오맵',
    appUrl: (lat, lng, name, currentLocation) => {
      if (!currentLocation) {
        return `kakaomap://look?p=${lat},${lng}&name=${encodeURIComponent(name)}`;
      }
      return `kakaomap://route?sp=${currentLocation.latitude},${currentLocation.longitude}&ep=${lat},${lng}&by=FOOT`;
    },
    webUrl: (lat, lng, name, currentLocation) => {
      if (!currentLocation) {
        return `https://map.kakao.com/link/map/${lat},${lng}`;
      }
      return `https://map.kakao.com/link/from/${encodeURIComponent('현재 위치')},${currentLocation.latitude},${currentLocation.longitude}/to/${encodeURIComponent(name)},${lat},${lng}`;
    },
    canOpenUrls: ['kakaomap://'],
  },
  {
    name: '구글맵',
    appUrl: (lat, lng) => {
      if (Platform.OS === 'ios') {
        return `comgooglemaps://?daddr=${lat},${lng}&directionsmode=walking`;
      }
      return `google.navigation:q=${lat},${lng}&mode=w`;
    },
    webUrl: (lat, lng, _name, currentLocation) => {
      if (!currentLocation) {
        return `https://www.google.com/maps?q=${lat},${lng}`;
      }
      return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${lat},${lng}&travelmode=walking`;
    },
    canOpenUrls: [
      'google.navigation:q=37.5665,126.9780',
      'geo:0,0?q=37.5665,126.9780',
      'comgooglemaps://',
    ],
  },
];

/**
 * 위경도 + 매장명 기준으로 설치된 지도 앱을 열어 길찾기를 시작한다.
 * - 1개만 설치됨: 바로 실행
 * - 2개 이상: 선택 Alert
 * - 모두 미설치: 네이버 지도 웹 fallback
 */
export async function openMapApp(
  lat: number,
  lng: number,
  name: string,
): Promise<void> {
  try {
    const currentLocation = await resolveCurrentLocation();
    const availableApps: Array<{ name: string; url: string }> = [];
    for (const app of MAP_APPS) {
      const supportChecks = await Promise.all(
        app.canOpenUrls.map((url) => Linking.canOpenURL(url)),
      );
      const supported = supportChecks.some(Boolean);
      if (supported) {
        availableApps.push({
          name: app.name,
          url: app.appUrl(lat, lng, name, currentLocation),
        });
      }
    }

    if (availableApps.length === 0) {
      await Linking.openURL(MAP_APPS[0].webUrl(lat, lng, name, currentLocation));
      return;
    }

    if (availableApps.length === 1) {
      await Linking.openURL(availableApps[0].url);
      return;
    }

    Alert.alert('지도 앱 선택', '어떤 지도 앱으로 열까요?', [
      ...availableApps.map((app) => ({
        text: app.name,
        onPress: () => {
          Linking.openURL(app.url).catch(() => undefined);
        },
      })),
      { text: '취소', style: 'cancel' as const },
    ]);
  } catch {
    Linking.openURL(MAP_APPS[0].webUrl(lat, lng, name, null)).catch(() => undefined);
  }
}
