import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import type { AuthStackParamList, MyPageStackParamList } from '../../navigation/types';
import Geolocation from 'react-native-geolocation-service';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MapViewWrapper from '../../components/map/MapViewWrapper';
import type { NaverGeocodeResult } from '../../api/naver-local.api';
import { useReverseGeocode, useGeocodeSearch } from '../../hooks/queries/useLocation';
import { useLocationStore } from '../../store/locationStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type LocationSetupRoute =
  | RouteProp<AuthStackParamList, 'LocationSetup'>
  | RouteProp<MyPageStackParamList, 'LocationSetup'>;

const LocationSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList | MyPageStackParamList>>();
  const route = useRoute<LocationSetupRoute>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsLatLng, setGpsLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [previewLocation, setPreviewLocation] = useState<{
    latitude: number;
    longitude: number;
    regionName: string;
  } | null>(null);

  const { setLocation } = useLocationStore();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: reverseGeocodedName, isError: isReverseError, isPending: isReversePending } =
    useReverseGeocode(gpsLatLng?.lng ?? null, gpsLatLng?.lat ?? null);

  const { data: geocodeResults, isFetching: isSearching } = useGeocodeSearch(debouncedSearchQuery);

  const searchResults: NaverGeocodeResult[] = useMemo(() => geocodeResults ?? [], [geocodeResults]);

  const selectedRegionName = previewLocation?.regionName ?? null;

  // Sync reverse geocode result → previewLocation
  useEffect(() => {
    if (gpsLatLng === null) return;
    if (isReversePending) return;
    setPreviewLocation({
      latitude: gpsLatLng.lat,
      longitude: gpsLatLng.lng,
      regionName: reverseGeocodedName ?? '현재 위치',
    });
    setIsGpsLoading(false);
  }, [gpsLatLng, reverseGeocodedName, isReverseError, isReversePending]);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '위치 권한',
        message: '주변 매장과 가격을 보려면 위치 권한이 필요합니다',
        buttonPositive: '허용',
        buttonNegative: '거부',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const handleGpsDetect = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('권한 거부', '위치 권한을 허용해야 동네를 자동으로 설정할 수 있습니다');
      return;
    }
    setIsGpsLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLatLng({ lat: latitude, lng: longitude });
        // isGpsLoading cleared by useEffect when reverseGeocodedName resolves
      },
      () => {
        setIsGpsLoading(false);
        Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다. 주소를 직접 검색해 주세요');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      },
    );
  }, [requestLocationPermission]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setDebouncedSearchQuery('');
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearchQuery(query), 300);
  }, []);

  const handleSelectAddress = (doc: NaverGeocodeResult) => {
    const latitude = parseFloat(doc.y);
    const longitude = parseFloat(doc.x);
    if (isNaN(latitude) || isNaN(longitude)) {
      Alert.alert('오류', '유효하지 않은 주소입니다. 다른 주소를 선택해 주세요.');
      return;
    }
    // jibunAddress = 동 이름(첫 토큰), roadAddress = 전체 주소(목록 표시용)
    const regionName = doc.jibunAddress || doc.roadAddress;
    setPreviewLocation({ latitude, longitude, regionName });
    setDebouncedSearchQuery('');
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (!previewLocation) {
      Alert.alert('동네를 선택해 주세요');
      return;
    }
    setLocation(previewLocation.latitude, previewLocation.longitude, previewLocation.regionName);
    // MyPageStack에서 진입한 경우(returnTo 파라미터 존재): 수동으로 goBack
    // AuthStack에서 진입한 경우: RootNavigator가 자동으로 Main으로 전환
    if (route.params?.returnTo === 'mypage') {
      navigation.goBack();
    }
  };

  useEffect(() => {
    handleGpsDetect();
  }, [handleGpsDetect]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>동네 설정</Text>
          <Text style={styles.subtitle}>어디서 장을 보시나요?</Text>

          {/* GPS 자동 감지 */}
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleGpsDetect}
            disabled={isGpsLoading}
            activeOpacity={0.8}>
            {isGpsLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.gpsButtonText}>📍 현재 위치 자동 감지</Text>
            )}
          </TouchableOpacity>

          {/* 선택된 지역 표시 */}
          {selectedRegionName ? (
            <View style={styles.selectedRegion}>
              <Text style={styles.selectedRegionLabel}>선택된 동네</Text>
              <Text style={styles.selectedRegionName}>{selectedRegionName}</Text>
            </View>
          ) : null}

          {/* 지도 미리보기 */}
          {previewLocation ? (
            <MapViewWrapper
              style={styles.mapPreview}
              initialCamera={{
                latitude: previewLocation.latitude,
                longitude: previewLocation.longitude,
                zoom: 14,
              }}
              isShowLocationButton={false}
              isShowZoomControls={false}
              isScrollGesturesEnabled={false}
              isZoomGesturesEnabled={false}
              isRotateGesturesEnabled={false}
              isTiltGesturesEnabled={false}
              mapType="Basic"
              locale="ko"
            >
              <NaverMapMarkerOverlay
                latitude={previewLocation.latitude}
                longitude={previewLocation.longitude}
                tintColor={colors.primary}
              />
            </MapViewWrapper>
          ) : null}

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는 직접 검색</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 주소 검색 */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="동 이름으로 검색 (예: 역삼동)"
              placeholderTextColor={colors.gray400}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator
                style={styles.searchIndicator}
                color={colors.primary}
                size="small"
              />
            ) : null}
          </View>

          {/* 검색 결과 */}
          {searchResults.length > 0 ? (
            <View style={styles.searchResultList}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={`${item.jibunAddress}-${item.x}-${item.y}`}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectAddress(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.searchResultText}>
                    {item.roadAddress || item.jibunAddress}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* 시작하기 버튼 */}
          <View style={[styles.bottomArea, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedRegionName && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedRegionName}
              activeOpacity={0.8}>
              <Text style={styles.confirmButtonText}>시작하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.displaySm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.gray600,
    marginBottom: spacing.lg,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  gpsButtonText: {
    ...typography.headingMd,
    color: colors.primary,
  },
  selectedRegion: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedRegionLabel: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  selectedRegionName: {
    ...typography.headingBase,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    ...typography.tagText,
    fontWeight: '400' as const,
    marginHorizontal: spacing.sm,
    color: colors.gray400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...typography.bodyMd,
    color: colors.black,
  },
  searchIndicator: {
    marginLeft: spacing.sm,
  },
  searchResultList: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  searchResultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  mapPreview: {
    height: spacing.locationMapPreviewH,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  searchResultText: {
    ...typography.bodyMd,
    color: colors.black,
  },
  bottomArea: {
    paddingTop: spacing.md,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  confirmButtonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default LocationSetupScreen;
