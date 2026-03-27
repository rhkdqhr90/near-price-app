import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useStoreDetail } from '../../hooks/queries/useStores';
import type { StoreResponse } from '../../types/api.types';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MapViewWrapper from '../../components/map/MapViewWrapper';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';

type Props = HomeScreenProps<'StoreDetail'>;

const STORE_TYPE_LABELS: Record<StoreResponse['type'], string> = {
  large_mart: '대형마트',
  mart: '마트',
  supermarket: '슈퍼마켓',
  convenience: '편의점',
  traditional_market: '전통시장',
};

interface MapApp {
  name: string;
  appUrl: (lat: number, lng: number, name: string) => string;
  webUrl: (lat: number, lng: number, name: string) => string;
  scheme: string;
}

const MAP_APPS: MapApp[] = [
  {
    name: '네이버 지도',
    appUrl: (lat, lng, name) => `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=com.nearprice`,
    webUrl: (lat, lng, name) => `https://map.naver.com/v5/directions/-/${lng},${lat},${encodeURIComponent(name)}/-/walk`,
    scheme: 'nmap://',
  },
  {
    name: '카카오맵',
    appUrl: (lat, lng, name) => `kakaomap://look?p=${lat},${lng}&name=${encodeURIComponent(name)}`,
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

const openMapApp = async (lat: number, lng: number, name: string) => {
  const availableApps: Array<{ name: string; url: string }> = [];

  for (const app of MAP_APPS) {
    const supported = await Linking.canOpenURL(app.scheme);
    if (supported) {
      availableApps.push({
        name: app.name,
        url: app.appUrl(lat, lng, name),
      });
    }
  }

  // 네이버 지도가 없으면 다른 앱 확인, 모두 없으면 웹 폴백
  if (availableApps.length === 0) {
    Linking.openURL(MAP_APPS[0].webUrl(lat, lng, name));
    return;
  }

  if (availableApps.length === 1) {
    Linking.openURL(availableApps[0].url);
    return;
  }

  // 여러 앱이 있으면 선택
  Alert.alert(
    '지도 앱 선택',
    '어떤 지도 앱으로 열까요?',
    [
      ...availableApps.map((app) => ({
        text: app.name,
        onPress: () => Linking.openURL(app.url),
      })),
      { text: '취소', style: 'cancel' },
    ]
  );
};

const StoreDetailScreen: React.FC<Props> = ({ route }) => {
  const { storeId } = route.params;
  const { data: store, isLoading, isError, isRefetching, refetch } = useStoreDetail(storeId);

  const handleDirections = useCallback(async () => {
    if (!store) return;
    await openMapApp(store.latitude, store.longitude, store.name);
  }, [store]);

  if (isLoading) {
    return <LoadingView message="매장 정보를 불러오는 중..." />;
  }
  if (isError || !store) {
    return <ErrorView message="매장 정보를 불러오지 못했습니다" onRetry={refetch} />;
  }

  // 마커 좌표가 유효한지 확인
  const isValidMarker = typeof store.latitude === 'number' && typeof store.longitude === 'number'
    && !isNaN(store.latitude) && !isNaN(store.longitude);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapViewWrapper
          style={styles.map}
          initialCamera={{
            latitude: store.latitude,
            longitude: store.longitude,
            zoom: 15,
          }}
          isShowLocationButton={false}
          isShowZoomControls={false}
          minZoom={10}
          maxZoom={18}
          mapType="Basic"
          locale="ko"
        >
          {isValidMarker && (
            <NaverMapMarkerOverlay
              latitude={store.latitude}
              longitude={store.longitude}
              tintColor={colors.primary}
              caption={{ text: store.name, textSize: 12, color: colors.primary }}
            />
          )}
        </MapViewWrapper>
      </View>

      <ScrollView
        style={styles.infoContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.storeTypeBadge}>
            <Text style={styles.storeTypeText}>{STORE_TYPE_LABELS[store.type] ?? store.type}</Text>
          </View>
        </View>
        <Text style={styles.storeAddress}>{store.address}</Text>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleDirections}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${store.name}으로 길찾기`}
        >
          <Text style={styles.directionsButtonText}>지도로 길찾기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  mapContainer: { height: spacing.storeMapH },
  map: { flex: 1 },
  infoContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storeName: {
    ...typography.headingBase,
    flex: 1,
  },
  storeTypeBadge: {
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  storeTypeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '500' as const,
  },
  storeAddress: {
    ...typography.tagText,
    color: colors.gray600,
    marginBottom: spacing.xxl,
  },
  directionsButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  directionsButtonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default StoreDetailScreen;
