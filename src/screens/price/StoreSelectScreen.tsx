import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Platform, PermissionsAndroid, ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import Geolocation from 'react-native-geolocation-service';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import type { CreateStoreDto, StoreType, NearbyStoreResponse } from '../../types/api.types';
import { useLocationStore } from '../../store/locationStore';
import { usePriceRegisterStore } from '../../store/priceRegisterStore';
import { useNearbyStores } from '../../hooks/queries/useNearbyStores';
import { useNaverPlaceSearch, type NaverPlaceDocument } from '../../hooks/queries/useNaverPlaceSearch';
import { storeApi } from '../../api/store.api';
import { isAxiosError } from '../../api/client';
import { NaverMapMarkerOverlay, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import MapViewWrapper from '../../components/map/MapViewWrapper';
import SearchIcon from '../../components/icons/SearchIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

// ─── 모듈 레벨 SearchBarHeader ────────────────────────────────────────────────
// ListHeaderComponent에서 사용: 내부 state로 value 관리하여
// 부모의 debouncedQuery 변경 시 remount 없이 키보드가 유지됨

interface SearchBarHeaderProps {
  onQueryChange: (debounced: string) => void;
}

const SearchBarHeader = React.memo<SearchBarHeaderProps>(({ onQueryChange }) => {
  const [value, setValue] = React.useState('');
  const debRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, []);

  const handleChange = React.useCallback((text: string) => {
    setValue(text);
    if (debRef.current) clearTimeout(debRef.current);
    if (text.length >= 2) {
      debRef.current = setTimeout(() => onQueryChange(text), 400);
    } else {
      onQueryChange('');
    }
  }, [onQueryChange]);

  const handleClear = React.useCallback(() => {
    setValue('');
    if (debRef.current) clearTimeout(debRef.current);
    onQueryChange('');
  }, [onQueryChange]);

  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchBar}>
        <SearchIcon size={16} color={colors.gray400} />
        <BottomSheetTextInput
          style={styles.searchInput}
          value={value}
          onChangeText={handleChange}
          placeholder="네이버 지도에서 매장 검색"
          placeholderTextColor={colors.gray400}
          returnKeyType="search"
          autoFocus={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ─── 네이버 카테고리 → StoreType 추론 ─────────────────────────────────────────
const inferStoreType = (category: string): StoreType => {
  const cat = category.toLowerCase();
  if (cat.includes('편의점')) return 'convenience';
  if (cat.includes('대형마트') || cat.includes('이마트') || cat.includes('코스트코') || cat.includes('홈플러스')) return 'large_mart';
  if (cat.includes('시장') || cat.includes('재래시장')) return 'traditional_market';
  if (cat.includes('슈퍼')) return 'supermarket';
  return 'mart';
};

// ─────────────────────────────────────────────────────────────────────────────

type Props = PriceRegisterScreenProps<'StoreSelect'>;
type SheetMode = 'loading' | 'detected' | 'searching' | 'registering';

interface GpsCoords {
  latitude: number;
  longitude: number;
}

interface PlaceMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

const AUTO_DETECT_RADIUS_M = 150;
const SNAP_POINTS = ['28%', '60%', '92%'];
const SNAP_PEEK = 0;
const SNAP_HALF = 1;
const SNAP_FULL = 2;

const STORE_TYPE_OPTIONS: { label: string; value: StoreType }[] = [
  { label: '마트', value: 'mart' },
  { label: '시장', value: 'traditional_market' },
  { label: '슈퍼', value: 'supermarket' },
  { label: '편의점', value: 'convenience' },
  { label: '대형마트', value: 'large_mart' },
];

const StoreSelectScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { latitude: regionLat, longitude: regionLng } = useLocationStore();
  const { setStore } = usePriceRegisterStore();

  const [sheetMode, setSheetMode] = useState<SheetMode>('loading');
  const [gpsCoords, setGpsCoords] = useState<GpsCoords | null>(null);
  const [detectionCoords, setDetectionCoords] = useState<GpsCoords | null>(null);
  const [detectedStore, setDetectedStore] = useState<NearbyStoreResponse | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreType, setNewStoreType] = useState<StoreType>('mart');

  const initialRegionLat = useRef(regionLat);
  const initialRegionLng = useRef(regionLng);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<NaverMapViewRef>(null);

  // ─── 자동 감지: 150m 이내 DB 매장 ───────────────────────────────────────────
  const { data: detectionStores, isSuccess: isDetectionSuccess, isError: isDetectionError } =
    useNearbyStores(
      detectionCoords?.latitude ?? null,
      detectionCoords?.longitude ?? null,
      AUTO_DETECT_RADIUS_M,
    );

  // ─── 네이버 장소 검색 ────────────────────────────────────────────────────────
  const { data: naverPlaces, isFetching: isNaverSearching, isError: isNaverError, refetch: refetchPlaces } =
    useNaverPlaceSearch(debouncedQuery, sheetMode === 'searching');

  // ─── 자동 감지 결과 처리 ───────────────────────────────────────────────────
  useEffect(() => {
    if (sheetMode !== 'loading') return;
    if (isDetectionSuccess) {
      const nearest = detectionStores && detectionStores.length > 0
        ? [...detectionStores].sort((a, b) => a.distance - b.distance)[0]
        : null;
      if (nearest) {
        setDetectedStore(nearest);
        setSheetMode('detected');
        bottomSheetRef.current?.snapToIndex(SNAP_PEEK);
      } else {
        setSheetMode('searching');
        bottomSheetRef.current?.snapToIndex(SNAP_HALF);
      }
    } else if (isDetectionError) {
      setSheetMode('searching');
      bottomSheetRef.current?.snapToIndex(SNAP_HALF);
    }
  }, [isDetectionSuccess, isDetectionError, detectionStores, sheetMode]);

  // ─── GPS 마운트 1회 실행 ────────────────────────────────────────────────────
  useEffect(() => {
    const fallbackLat = initialRegionLat.current;
    const fallbackLng = initialRegionLng.current;

    const requestPermission = async (): Promise<boolean> => {
      if (Platform.OS !== 'android') return true;
      const already = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (already) return true;
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '위치 권한',
          message: '주변 매장을 자동으로 감지하려면 위치 권한이 필요합니다',
          buttonPositive: '허용',
          buttonNegative: '건너뜀',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    };

    const run = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        if (fallbackLat != null && fallbackLng != null) {
          setGpsCoords({ latitude: fallbackLat, longitude: fallbackLng });
        }
        setSheetMode('searching');
        bottomSheetRef.current?.snapToIndex(SNAP_HALF);
        return;
      }

      Geolocation.getCurrentPosition(
        pos => {
          const coords: GpsCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setGpsCoords(coords);
          setDetectionCoords(coords);
          mapRef.current?.animateCameraTo({
            latitude: coords.latitude,
            longitude: coords.longitude,
            zoom: 16,
          });
        },
        () => {
          if (fallbackLat != null && fallbackLng != null) {
            setGpsCoords({ latitude: fallbackLat, longitude: fallbackLng });
            setDetectionCoords({ latitude: fallbackLat, longitude: fallbackLng });
          } else {
            Alert.alert('위치 정보 없음', '저장된 위치 정보가 없어 서울 기준으로 검색됩니다.');
            setSheetMode('searching');
            bottomSheetRef.current?.snapToIndex(SNAP_HALF);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, forceRequestLocation: true },
      );
    };

    void run();
  }, []);

  // ─── 동적 스타일 (insets 기반) ───────────────────────────────────────────────
  const dynamicStyles = useMemo(() => ({
    backFabTop: { top: insets.top + spacing.sm },
    listContentPadding: { paddingBottom: insets.bottom + spacing.xxl },
  }), [insets.top, insets.bottom]);

  // ─── 지도 중심 ───────────────────────────────────────────────────────────────
  const mapCenter = useMemo(() => ({
    latitude: gpsCoords?.latitude ?? regionLat ?? 37.5665,
    longitude: gpsCoords?.longitude ?? regionLng ?? 126.9780,
  }), [gpsCoords, regionLat, regionLng]);

  // ─── 지도 마커 ───────────────────────────────────────────────────────────────
  const mapMarkers = useMemo<PlaceMarker[]>(() => {
    if (sheetMode === 'detected' && detectedStore) {
      return [{
        id: detectedStore.id,
        latitude: detectedStore.latitude,
        longitude: detectedStore.longitude,
        title: detectedStore.name,
      }];
    }
    if (sheetMode === 'searching' && naverPlaces) {
      return naverPlaces.map(p => ({
        id: p.id,
        latitude: parseFloat(p.y),
        longitude: parseFloat(p.x),
        title: p.name,
      }));
    }
    return [];
  }, [sheetMode, detectedStore, naverPlaces]);

  // ─── 감지된 DB 매장 선택 ────────────────────────────────────────────────────
  const handleSelectDetected = useCallback((store: NearbyStoreResponse) => {
    setStore(store.id, store.name);
    navigation.navigate('InputMethod');
  }, [setStore, navigation]);

  // ─── 네이버 장소 선택 → DB find-or-create ───────────────────────────────────
  const { mutate: selectNaverPlace, isPending: isSelectingPlace } = useMutation({
    mutationFn: async (place: NaverPlaceDocument) => {
      try {
        const existing = await storeApi.getByExternalId(place.id).then(r => r.data);
        return existing;
      } catch (err) {
        if (!isAxiosError(err) || err.response?.status !== 404) throw err;
        const dto: CreateStoreDto = {
          name: place.name,
          type: inferStoreType(place.category),
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x),
          address: place.roadAddress || place.address,
          externalPlaceId: place.id,
        };
        return storeApi.create(dto).then(r => r.data);
      }
    },
    onSuccess: store => {
      setStore(store.id, store.name);
      navigation.navigate('InputMethod');
    },
    onError: () => {
      Alert.alert('오류', '매장 정보를 처리하는 데 실패했습니다.');
    },
  });

  const handleSelectNaverPlace = useCallback((place: NaverPlaceDocument) => {
    setSelectedPlaceId(place.id);
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 16 });
    }
    selectNaverPlace(place);
  }, [selectNaverPlace]);

  // ─── 직접 등록 ───────────────────────────────────────────────────────────────
  const { mutate: createStore, isPending: isCreating } = useMutation({
    mutationFn: (dto: CreateStoreDto) => storeApi.create(dto).then(r => r.data),
    onSuccess: created => {
      setStore(created.id, created.name);
      navigation.navigate('InputMethod');
    },
    onError: () => {
      Alert.alert('오류', '매장 등록에 실패했습니다.');
    },
  });

  const handleRegisterStore = useCallback(() => {
    if (!newStoreName.trim()) {
      Alert.alert('입력 필요', '매장명을 입력해주세요.');
      return;
    }
    if (!newStoreAddress.trim()) {
      Alert.alert('입력 필요', '주소를 입력해주세요.');
      return;
    }
    const lat = gpsCoords?.latitude ?? initialRegionLat.current;
    const lng = gpsCoords?.longitude ?? initialRegionLng.current;
    if (lat == null || lng == null) {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
      return;
    }
    createStore({
      name: newStoreName.trim(),
      type: newStoreType,
      latitude: lat,
      longitude: lng,
      address: newStoreAddress.trim(),
    });
  }, [newStoreName, newStoreAddress, newStoreType, gpsCoords, createStore]);

  // ─── 바텀 시트 헤더 ──────────────────────────────────────────────────────────

  const listHeader = useMemo((): React.ReactElement | null => {
    if (sheetMode === 'loading') {
      return (
        <View style={styles.centeredPad}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>주변 매장을 찾고 있어요...</Text>
        </View>
      );
    }

    if (sheetMode === 'detected' && detectedStore) {
      return (
        <View style={styles.detectedWrap}>
          <View style={styles.detectedTop}>
            <MapPinIcon size={18} color={colors.primary} />
            <Text style={styles.detectedLabel}>바로 여기 있어요</Text>
          </View>
          <View style={styles.detectedCard}>
            <View style={styles.detectedIconBox}>
              <StoreIcon size={22} color={colors.primary} />
            </View>
            <View style={styles.detectedInfo}>
              <Text style={styles.detectedName} numberOfLines={1}>{detectedStore.name}</Text>
              <Text style={styles.detectedAddress} numberOfLines={1}>{detectedStore.address}</Text>
              <Text style={styles.detectedDist}>{detectedStore.distance}m 거리</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleSelectDetected(detectedStore)}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>여기에요!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              setSheetMode('searching');
              bottomSheetRef.current?.snapToIndex(SNAP_HALF);
            }}
            activeOpacity={0.7}>
            <Text style={styles.ghostBtnText}>다른 매장이에요</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (sheetMode === 'registering') {
      return (
        <View style={styles.registerWrap}>
          <TouchableOpacity
            style={styles.registerBack}
            onPress={() => {
              setSheetMode('searching');
              bottomSheetRef.current?.snapToIndex(SNAP_HALF);
            }}>
            <Text style={styles.registerBackText}>← 목록으로</Text>
          </TouchableOpacity>
          <Text style={styles.registerTitle}>새 매장 등록</Text>
          <Text style={styles.fieldLabel}>매장명 *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={newStoreName}
            onChangeText={setNewStoreName}
            placeholder="예: 우리마트 광교점"
            placeholderTextColor={colors.gray400}
          />
          <Text style={styles.fieldLabel}>주소 *</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={newStoreAddress}
            onChangeText={setNewStoreAddress}
            placeholder="예: 서울 강남구 테헤란로 123"
            placeholderTextColor={colors.gray400}
          />
          <Text style={styles.fieldLabel}>매장 유형</Text>
          <View style={styles.typeRow}>
            {STORE_TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeChip, newStoreType === opt.value && styles.typeChipActive]}
                onPress={() => setNewStoreType(opt.value)}>
                <Text style={[styles.typeChipText, newStoreType === opt.value && styles.typeChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.registerBtn, isCreating && styles.btnDisabled]}
            onPress={handleRegisterStore}
            disabled={isCreating}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{isCreating ? '등록 중...' : '등록하기'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // searching 모드: element 직접 반환 → FlatList가 재사용, 재마운트 없음
    return <SearchBarHeader onQueryChange={setDebouncedQuery} />;
  }, [
    sheetMode, detectedStore, newStoreName, newStoreAddress, newStoreType,
    isCreating, handleSelectDetected, handleRegisterStore, setDebouncedQuery,
  ]);

  // ─── 리스트 아이템 ────────────────────────────────────────────────────────────

  const renderStoreItem = useCallback(({ item }: ListRenderItemInfo<NaverPlaceDocument>) => (
    <TouchableOpacity
      style={[styles.storeItem, selectedPlaceId === item.id && styles.storeItemActive]}
      onPress={() => handleSelectNaverPlace(item)}
      disabled={isSelectingPlace}
      activeOpacity={0.7}>
      <View style={styles.storeIconBox}>
        <StoreIcon size={18} color={selectedPlaceId === item.id ? colors.primary : colors.gray600} />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.storeAddress} numberOfLines={1}>{item.roadAddress || item.address}</Text>
        {item.category ? (
          <Text style={styles.storeCategory} numberOfLines={1}>{item.category}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ), [selectedPlaceId, handleSelectNaverPlace, isSelectingPlace]);

  // ─── 리스트 빈 상태 ───────────────────────────────────────────────────────────

  const renderListEmpty = useCallback(() => {
    if (sheetMode !== 'searching') return null;
    if (debouncedQuery.length < 2) {
      return (
        <View style={styles.centeredPad}>
          <Text style={styles.emptyText}>매장명을 입력해 검색하세요</Text>
        </View>
      );
    }
    if (isNaverSearching) {
      return (
        <View style={styles.centeredPad}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (isNaverError) {
      return (
        <View style={styles.centeredPad}>
          <Text style={styles.emptyText}>검색에 실패했어요</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refetchPlaces()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centeredPad}>
        <Text style={styles.emptyText}>검색 결과가 없어요</Text>
      </View>
    );
  }, [sheetMode, debouncedQuery, isNaverSearching, isNaverError, refetchPlaces]);

  // ─── 리스트 푸터 ──────────────────────────────────────────────────────────────

  const renderListFooter = useCallback(() => {
    if (sheetMode !== 'searching') return null;
    return (
      <TouchableOpacity
        style={styles.registerFooter}
        onPress={() => {
          setNewStoreName(debouncedQuery);
          setSheetMode('registering');
          bottomSheetRef.current?.snapToIndex(SNAP_FULL);
        }}
        activeOpacity={0.7}>
        <Text style={styles.registerFooterText}>찾는 매장이 없어요 → 직접 등록</Text>
      </TouchableOpacity>
    );
  }, [sheetMode, debouncedQuery]);

  return (
    <View style={styles.container}>
      <MapViewWrapper
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialCamera={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          zoom: 14,
        }}
        isShowLocationButton
        isShowZoomControls={false}
        minZoom={10}
        maxZoom={18}
        mapType="Basic"
        locale="ko">
        {mapMarkers.map(m => (
          <NaverMapMarkerOverlay
            key={m.id}
            latitude={m.latitude}
            longitude={m.longitude}
            onTap={() => setSelectedPlaceId(m.id)}
            tintColor={selectedPlaceId === m.id ? colors.danger : colors.primary}
            caption={{
              text: m.title,
              textSize: 11,
              color: selectedPlaceId === m.id ? colors.danger : colors.primary,
            }}
          />
        ))}
      </MapViewWrapper>

      <TouchableOpacity
        style={[styles.backFab, dynamicStyles.backFabTop]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}>
        <Text style={styles.backFabText}>←</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose={false}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handleBar}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize">
        <BottomSheetFlatList
          style={styles.flatList}
          data={sheetMode === 'searching' ? (naverPlaces ?? []) : []}
          keyExtractor={(item: NaverPlaceDocument) => item.id}
          renderItem={renderStoreItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderListEmpty}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={[styles.listContent, dynamicStyles.listContentPadding]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatList: { flex: 1 },

  backFab: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  backFabText: {
    ...typography.headingXl,
    lineHeight: 22,
  },

  sheetBg: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  handleBar: {
    backgroundColor: colors.gray200,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  listContent: {
    flexGrow: 1,
  },

  centeredPad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  retryText: {
    ...typography.tagText,
    color: colors.primary,
  },

  detectedWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  detectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detectedLabel: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  detectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedInfo: {
    flex: 1,
  },
  detectedName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  detectedAddress: {
    ...typography.bodySm,
    marginBottom: spacing.micro,
  },
  detectedDist: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.headingMd,
    color: colors.white,
  },
  ghostBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostBtnText: {
    ...typography.tagText,
    color: colors.gray600,
  },
  btnDisabled: {
    backgroundColor: colors.gray400,
  },

  searchHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  clearText: {
    ...typography.body,
    color: colors.gray400,
  },

  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  storeItemActive: {
    backgroundColor: colors.primaryLight,
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  storeAddress: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  storeCategory: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.micro,
  },

  registerFooter: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  registerFooterText: {
    ...typography.tagText,
    color: colors.primary,
  },

  registerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  registerBack: {
    paddingBottom: spacing.md,
  },
  registerBackText: {
    ...typography.tagText,
    color: colors.primary,
  },
  registerTitle: {
    ...typography.headingLg,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeChip: {
    backgroundColor: colors.gray100,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    ...typography.tagText,
    color: colors.gray600,
  },
  typeChipTextActive: {
    color: colors.white,
  },
  registerBtn: {
    marginTop: spacing.xl,
  },
});

export default StoreSelectScreen;
