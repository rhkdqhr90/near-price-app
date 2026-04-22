import { Linking, Alert } from 'react-native';

// 길찾기 대상 지도 앱. 설치된 앱만 선택 UI에 노출.
interface MapApp {
  name: string;
  appUrl: (lat: number, lng: number, name: string) => string;
  webUrl: (lat: number, lng: number, name: string) => string;
  scheme: string;
}

const MAP_APPS: MapApp[] = [
  {
    name: '네이버 지도',
    appUrl: (lat, lng, name) =>
      `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=com.nearprice`,
    webUrl: (lat, lng, name) =>
      `https://map.naver.com/v5/directions/-/${lng},${lat},${encodeURIComponent(name)}/-/walk`,
    scheme: 'nmap://',
  },
  {
    name: '카카오맵',
    appUrl: (lat, lng, name) =>
      `kakaomap://look?p=${lat},${lng}&name=${encodeURIComponent(name)}`,
    webUrl: (lat, lng) => `https://map.kakao.com/link/map/${lat},${lng}`,
    scheme: 'kakaomap://',
  },
  {
    name: '구글맵',
    appUrl: (lat, lng) => `google.navigation:q=${lat},${lng}`,
    webUrl: (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`,
    scheme: 'google.navigation://',
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
    const availableApps: Array<{ name: string; url: string }> = [];
    for (const app of MAP_APPS) {
      const supported = await Linking.canOpenURL(app.scheme);
      if (supported) {
        availableApps.push({ name: app.name, url: app.appUrl(lat, lng, name) });
      }
    }

    if (availableApps.length === 0) {
      await Linking.openURL(MAP_APPS[0].webUrl(lat, lng, name));
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
    Linking.openURL(MAP_APPS[0].webUrl(lat, lng, name)).catch(() => undefined);
  }
}
