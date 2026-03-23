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
import MapPinIcon from '../../components/icons/MapPinIcon';
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

  // 인라인 에러 배너 상태
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { setLocation } = useLocationStore();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    data: reverseGeocodedName,
    isError: isReverseError,
    isPending: isReversePending,
    isFetching: isReverseFetching,
    invalidateAndRefetch,
  } = useReverseGeocode(gpsLatLng?.lng ?? null, gpsLatLng?.lat ?? null);

  const { data: geocodeResults, isFetching: isSearching } = useGeocodeSearch(debouncedSearchQuery);

  const searchResults: NaverGeocodeResult[] = useMemo(() => geocodeResults ?? [], [geocodeResults]);

  const selectedRegionName = previewLocation?.regionName || null;

  // Sync reverse geocode result → previewLocation
  // 이전에 처리한 결과를 추적하여 무한 루프 방지
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    if (gpsLatLng === null) return;
    if (isReverseFetching) return; // 아직 로딩 중이면 대기

    // 동일한 결과를 중복 처리하지 않음
    const resultKey = `${gpsLatLng.lat},${gpsLatLng.lng},${reverseGeocodedName ?? ''},${isReverseError}`;
    if (lastProcessedRef.current === resultKey) return;
    lastProcessedRef.current = resultKey;

    if (isReverseError) {
      setPreviewLocation({
        latitude: gpsLatLng.lat,
        longitude: gpsLatLng.lng,
        regionName: '',
      });
      setIsGpsLoading(false);
      setInlineError('현재 위치의 동네 정보를 가져올 수 없습니다. 주소를 직접 검색하거나 다시 시도해 주세요.');
      return;
    }

    if (reverseGeocodedName) {
      setPreviewLocation({
        latitude: gpsLatLng.lat,
        longitude: gpsLatLng.lng,
        regionName: reverseGeocodedName,
      });
      setInlineError(null);
    } else if (reverseGeocodedName === null) {
      // API 성공이지만 동 이름 없음 (해상/산간 지역 등)
      setPreviewLocation({
        latitude: gpsLatLng.lat,
        longitude: gpsLatLng.lng,
        regionName: '',
      });
    }
    setIsGpsLoading(false);
  }, [gpsLatLng, reverseGeocodedName, isReverseError, isReverseFetching]);

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
    setInlineError(null);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setInlineError('위치 권한을 허용해야 동네를 자동으로 설정할 수 있습니다.');
      return;
    }
    setIsGpsLoading(true);
    // 이전 역지오코딩 캐시 무효화 (실패 결과 재사용 방지)
    invalidateAndRefetch().catch(() => {});
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLatLng({ lat: latitude, lng: longitude });
        // isGpsLoading cleared by useEffect when reverseGeocodedName resolves
      },
      () => {
        setIsGpsLoading(false);
        setInlineError('현재 위치를 가져올 수 없습니다. 주소를 직접 검색해 주세요.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      },
    );
  }, [requestLocationPermission, invalidateAndRefetch]);

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
      setInlineError('유효하지 않은 주소입니다. 다른 주소를 선택해 주세요.');
      return;
    }
    setInlineError(null);
    // jibunAddress = 동 이름(첫 토큰), roadAddress = 전체 주소(목록 표시용)
    const regionName = doc.jibunAddress || doc.roadAddress;
    setPreviewLocation({ latitude, longitude, regionName });
    setDebouncedSearchQuery('');
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (!previewLocation) {
      setInlineError('동네를 선택해 주세요.');
      return;
    }
    setLocation(previewLocation.latitude, previewLocation.longitude, previewLocation.regionName);
    // MyPageStack에서 진입한 경우(returnTo 파라미터 존재): 수동으로 goBack
    // AuthStack에서 진입한 경우: RootNavigator가 자동으로 Main으로 전환
    if (route.params?.returnTo === 'mypage') {
      navigation.goBack();
    }
  };

  // 마운트 시 1회만 GPS 감지 실행
  // handleGpsDetect를 deps에 넣으면 queryKey 변경 → 무한 루프 발생
  const handleGpsDetectRef = useRef(handleGpsDetect);
  handleGpsDetectRef.current = handleGpsDetect;
  useEffect(() => {
    handleGpsDetectRef.current();
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>동네 설정</Text>
          <Text style={styles.subtitle}>어디서 장을 보시나요?</Text>

          {/* 인라인 에러 배너 */}
          {inlineError ? (
            <View style={styles.errorBanner} accessible={true} accessibilityLiveRegion="polite" accessibilityLabel={`오류: ${inlineError}`}>
              <Text style={styles.errorBannerText}>{inlineError}</Text>
              <TouchableOpacity
                onPress={() => setInlineError(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="오류 메시지 닫기"
              >
                <Text style={styles.errorBannerClose}>닫기</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* GPS 자동 감지 */}
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleGpsDetect}
            disabled={isGpsLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="현재 위치 자동 감지"
          >
            {isGpsLoading ? (
              <ActivityIndicator color={colors.primary} size="small" accessibilityLabel="위치 감지 중" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <MapPinIcon size={spacing.iconSm} color={colors.primary} />
                <Text style={styles.gpsButtonText}>현재 위치 자동 감지</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 선택된 지역 표시 */}
          {selectedRegionName ? (
            <View style={styles.selectedRegion}>
              <Text style={styles.selectedRegionLabel}>선택된 동네</Text>
              <Text style={styles.selectedRegionName}>{selectedRegionName}</Text>
            </View>
          ) : null}

          {/* 지도 미리보기 — key로 위치 변경 시 지도 리마운트 */}
          {previewLocation ? (
            <MapViewWrapper
              key={`${previewLocation.latitude}_${previewLocation.longitude}`}
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
              {typeof previewLocation.latitude === 'number' && typeof previewLocation.longitude === 'number'
                && !isNaN(previewLocation.latitude) && !isNaN(previewLocation.longitude) && (
                  <NaverMapMarkerOverlay
                    latitude={previewLocation.latitude}
                    longitude={previewLocation.longitude}
                    tintColor={colors.primary}
                  />
                )}
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
              onFocus={() => {
                // 키보드가 올라올 때 검색란이 보이도록 스크롤
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
              }}
              placeholder="동 이름으로 검색 (예: 역삼동)"
              placeholderTextColor={colors.gray400}
              returnKeyType="search"
              accessibilityLabel="동 이름 검색"
              accessibilityHint="동 이름으로 지역을 검색하세요"
            />
            {isSearching ? (
              <ActivityIndicator
                style={styles.searchIndicator}
                color={colors.primary}
                size="small"
                accessibilityLabel="검색 중"
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
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`주소 ${item.roadAddress || item.jibunAddress}`}
                >
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
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={selectedRegionName ? `${selectedRegionName}로 시작하기` : '동네를 선택하세요'}
              accessibilityState={{ disabled: !selectedRegionName }}
            >
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
  // 인라인 에러 배너
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: colors.danger,
    flex: 1,
  },
  errorBannerClose: {
    ...typography.tagText,
    color: colors.danger,
    fontWeight: '600' as const,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
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
    borderRadius: spacing.sm,
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
