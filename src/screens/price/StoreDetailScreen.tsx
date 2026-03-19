import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
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

const openNaverMapRoute = (lat: number, lng: number, name: string) => {
  const appUrl = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=com.nearprice`;
  const webUrl = `https://map.naver.com/v5/directions/-/${lng},${lat},${encodeURIComponent(name)}/-/walk`;
  Linking.canOpenURL(appUrl).then((supported) => {
    Linking.openURL(supported ? appUrl : webUrl);
  });
};

const StoreDetailScreen: React.FC<Props> = ({ route }) => {
  const { storeId } = route.params;
  const { data: store, isLoading, isError, refetch } = useStoreDetail(storeId);

  const handleDirections = useCallback(() => {
    if (!store) return;
    openNaverMapRoute(store.latitude, store.longitude, store.name);
  }, [store]);

  if (isLoading) {
    return <LoadingView message="매장 정보를 불러오는 중..." />;
  }
  if (isError || !store) {
    return <ErrorView message="매장 정보를 불러오지 못했습니다" onRetry={refetch} />;
  }

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
          <NaverMapMarkerOverlay
            latitude={store.latitude}
            longitude={store.longitude}
            tintColor={colors.primary}
            caption={{ text: store.name, textSize: 12, color: colors.primary }}
          />
        </MapViewWrapper>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.storeTypeBadge}>
            <Text style={styles.storeTypeText}>{STORE_TYPE_LABELS[store.type]}</Text>
          </View>
        </View>
        <Text style={styles.storeAddress}>{store.address}</Text>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleDirections}
          activeOpacity={0.7}
        >
          <Text style={styles.directionsButtonText}>네이버 지도로 길찾기</Text>
        </TouchableOpacity>
      </View>
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
    borderRadius: 4,
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
    borderRadius: 8,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  directionsButtonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default StoreDetailScreen;
