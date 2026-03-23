import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Platform, PermissionsAndroid, ActivityIndicator,
  TextInput, FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import Geolocation from 'react-native-geolocation-service';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import type { CreateStoreDto, StoreType, NearbyStoreResponse } from '../../types/api.types';
import { useLocationStore } from '../../store/locationStore';
import { usePriceRegisterStore } from '../../store/priceRegisterStore';
import { useNearbyStores } from '../../hooks/queries/useNearbyStores';
import { useNaverPlaceSearch, type NaverPlaceDocument } from '../../hooks/queries/useNaverPlaceSearch';
import { storeApi } from '../../api/store.api';
import { naverLocalApi } from '../../api/naver-local.api';
import { vworldApi } from '../../api/vworld.api';
import { isAxiosError } from '../../api/client';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { NaverMapMarkerOverlay, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import MapViewWrapper from '../../components/map/MapViewWrapper';
import SearchIcon from '../../components/icons/SearchIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import CloseIcon from '../../components/icons/CloseIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useStoreTypes } from '../../hooks/useStoreTypes';

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

const StoreSelectScreen: React.FC<Props> = ({ navigation }) => {
  const { storeTypes, isLoading: isStoreTypesLoading, addStoreType } = useStoreTypes();
  const insets = useSafeAreaInsets();
  const { latitude: regionLat, longitude: regionLng, regionName } = useLocationStore();
  const { setStore } = usePriceRegisterStore();

  // 작성 중 뒤로가기 시 확인 다이얼로그
  useUnsavedChangesWarning();

  const [uiMode, setUiMode] = useState<'search' | 'detected' | 'register'>('search');
  const [gpsCoords, setGpsCoords] = useState<GpsCoords | null>(null);
  const [detectionCoords, setDetectionCoords] = useState<GpsCoords | null>(null);
  const [detectedStore, setDetectedStore] = useState<NearbyStoreResponse | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [userDismissedDetection, setUserDismissedDetection] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreType, setNewStoreType] = useState<StoreType | string>('mart');
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; address?: string }>({});
  const [showAddStoreType, setShowAddStoreType] = useState(false);
  const [newStoreTypeInput, setNewStoreTypeInput] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<NaverPlaceDocument | null>(null);

  const initialRegionLat = useRef(regionLat);
  const initialRegionLng = useRef(regionLng);
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
    useNaverPlaceSearch(debouncedQuery, showSearchResults, regionName ?? undefined);

  // ─── DB 매장 검색 (우리 앱에 등록된 매장) ──────────────────────────────────
  const { data: dbStores } = useQuery({
    queryKey: ['storeSearch', debouncedQuery],
    queryFn: () => storeApi.searchByName(debouncedQuery).then(r => r.data),
    enabled: showSearchResults && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  // ─── 화면 재진입 시 상태 리셋 ─────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      // 화면에 포커스가 올 때마다 감지 상태 리셋
      detectionProcessedRef.current = false;
      setUserDismissedDetection(false);
      setShowSearchResults(false);
      setDebouncedQuery('');
      setSelectedPlaceId(null);
      setUiMode('search');
    }, []),
  );

  // ─── 자동 감지 결과 처리 ───────────────────────────────────────────────────
  const detectionProcessedRef = useRef(false);
  useEffect(() => {
    if (detectionProcessedRef.current) return;
    if (uiMode !== 'search') return;
    if (userDismissedDetection) return;
    if (isDetectionSuccess) {
      detectionProcessedRef.current = true;
      const nearest = detectionStores && detectionStores.length > 0
        ? [...detectionStores].sort((a, b) => a.distance - b.distance)[0]
        : null;
      if (nearest) {
        setDetectedStore(nearest);
        setUiMode('detected');
      } else {
        // DB에 매장이 없으면 → "마트"로 자동 검색
        setDebouncedQuery('마트');
        setShowSearchResults(true);
      }
    } else if (isDetectionError) {
      detectionProcessedRef.current = true;
      // 감지 실패 → "마트"로 자동 검색
      setDebouncedQuery('마트');
      setShowSearchResults(true);
    }
  }, [isDetectionSuccess, isDetectionError, detectionStores, uiMode, userDismissedDetection]);

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
        setShowSearchResults(true);
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
        (error) => {
          // GPS 실패 시 동네 설정 좌표로 폴백
          if (fallbackLat != null && fallbackLng != null) {
            setGpsCoords({ latitude: fallbackLat, longitude: fallbackLng });
            setDetectionCoords({ latitude: fallbackLat, longitude: fallbackLng });
            mapRef.current?.animateCameraTo({
              latitude: fallbackLat,
              longitude: fallbackLng,
              zoom: 15,
            });
          } else {
            Alert.alert('위치 정보 없음', '저장된 위치 정보가 없어 서울 기준으로 검색됩니다.');
            setShowSearchResults(true);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, forceRequestLocation: true },
      );
    };

    void run();
  }, []);


  // ─── 지도 중심 ───────────────────────────────────────────────────────────────
  const mapCenter = useMemo(() => ({
    latitude: gpsCoords?.latitude ?? regionLat ?? 37.5665,
    longitude: gpsCoords?.longitude ?? regionLng ?? 126.9780,
  }), [gpsCoords, regionLat, regionLng]);

  // ─── 지도 마커 ───────────────────────────────────────────────────────────────
  const mapMarkers = useMemo<PlaceMarker[]>(() => {
    if (uiMode === 'detected' && detectedStore) {
      return [{
        id: detectedStore.id,
        latitude: detectedStore.latitude,
        longitude: detectedStore.longitude,
        title: detectedStore.name,
      }];
    }
    if (showSearchResults && naverPlaces) {
      return naverPlaces.map(p => ({
        id: p.id,
        latitude: parseFloat(p.y),
        longitude: parseFloat(p.x),
        title: p.name,
      }));
    }
    return [];
  }, [uiMode, showSearchResults, detectedStore, naverPlaces]);

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

  // 목록에서 매장 탭 → 지도 이동 + 확인 모달 표시 (바로 등록하지 않음)
  const handleSelectNaverPlace = useCallback((place: NaverPlaceDocument) => {
    setSelectedPlaceId(place.id);
    setPendingPlace(place);
    setShowSearchResults(false); // 목록 닫기
    // 지도 카메라를 해당 위치로 이동
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 17 });
    }
  }, []);

  // 확인 모달에서 "이 매장이에요" 누르면 실제 등록/선택 진행
  const handleConfirmPlace = useCallback(() => {
    if (!pendingPlace) return;
    selectNaverPlace(pendingPlace);
  }, [pendingPlace, selectNaverPlace]);

  // 확인 모달에서 "다른 매장" 누르면 목록으로 복귀
  const handleCancelPlace = useCallback(() => {
    setPendingPlace(null);
    setSelectedPlaceId(null);
    setShowSearchResults(true);
  }, []);

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

  // GPS 좌표로부터 역지오코딩하여 전체 주소 자동 채우기
  const handleAutoFillAddress = useCallback(() => {
    if (!gpsCoords) {
      Alert.alert('위치 오류', '현재 위치를 먼저 감지해주세요.');
      return;
    }
    vworldApi.reverseGeocodeFullAddress(gpsCoords.longitude, gpsCoords.latitude)
      .then(address => {
        if (address) {
          setNewStoreAddress(address);
        } else {
          Alert.alert('주소 조회 실패', '현재 위치의 주소를 찾을 수 없습니다. 직접 입력해주세요.');
        }
      })
      .catch(() => {
        Alert.alert('오류', '주소를 조회하는 중 오류가 발생했습니다.');
      });
  }, [gpsCoords]);

  const handleAddStoreType = useCallback(async () => {
    if (!newStoreTypeInput.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }
    const success = await addStoreType(newStoreTypeInput.trim());
    if (success) {
      Alert.alert('완료', '새 카테고리가 추가됐습니다.');
      setNewStoreTypeInput('');
      setShowAddStoreType(false);
    } else {
      Alert.alert('오류', '이미 존재하는 카테고리입니다.');
    }
  }, [newStoreTypeInput, addStoreType]);

  const handleRegisterStore = useCallback(() => {
    const errs: { name?: string; address?: string } = {};
    let hasError = false;
    if (!newStoreName.trim()) {
      errs.name = '매장명을 입력해주세요.';
      hasError = true;
    }
    if (!newStoreAddress.trim()) {
      errs.address = '주소를 입력해주세요.';
      hasError = true;
    }
    if (hasError) {
      setRegisterErrors(errs);
      return;
    }
    setRegisterErrors({});
    const lat = gpsCoords?.latitude ?? initialRegionLat.current;
    const lng = gpsCoords?.longitude ?? initialRegionLng.current;
    if (lat == null || lng == null) {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
      return;
    }
    createStore({
      name: newStoreName.trim(),
      type: newStoreType as StoreType,
      latitude: lat,
      longitude: lng,
      address: newStoreAddress.trim(),
    });
  }, [newStoreName, newStoreAddress, newStoreType, gpsCoords, createStore]);

  // ─── 감지된 매장 모달 (오버레이) ────────────────────────────────────────────────
  const renderDetectedModal = () => {
    if (uiMode !== 'detected' || !detectedStore) return null;

    return (
      <View style={[styles.modal, styles.modalContainer]}>
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
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${detectedStore.name} 선택`}>
            <Text style={styles.primaryBtnText}>여기에요!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              setUserDismissedDetection(true);
              setUiMode('search');
              setShowSearchResults(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="다른 매장 검색">
            <Text style={styles.ghostBtnText}>다른 매장이에요</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── 검색 매장 확인 모달 (지도 이동 후 확인) ─────────────────────────────────
  const renderPendingPlaceModal = () => {
    if (!pendingPlace) return null;

    return (
      <View style={[styles.modal, styles.modalContainer]}>
        <View style={styles.detectedWrap}>
          <View style={styles.detectedTop}>
            <MapPinIcon size={18} color={colors.primary} />
            <Text style={styles.detectedLabel}>이 매장이 맞나요?</Text>
          </View>
          <View style={styles.detectedCard}>
            <View style={styles.detectedIconBox}>
              <StoreIcon size={22} color={colors.primary} />
            </View>
            <View style={styles.detectedInfo}>
              <Text style={styles.detectedName} numberOfLines={1}>{pendingPlace.name}</Text>
              <Text style={styles.detectedAddress} numberOfLines={1}>{pendingPlace.roadAddress || pendingPlace.address}</Text>
              {pendingPlace.category ? (
                <Text style={styles.detectedDist}>{pendingPlace.category}</Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, isSelectingPlace && styles.btnDisabled]}
            onPress={handleConfirmPlace}
            disabled={isSelectingPlace}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${pendingPlace.name} 선택`}>
            <Text style={styles.primaryBtnText}>
              {isSelectingPlace ? '처리 중...' : '이 매장이에요!'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={handleCancelPlace}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="다른 매장 검색">
            <Text style={styles.ghostBtnText}>다른 매장 볼게요</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── 매장 등록 모달 (오버레이) ────────────────────────────────────────────────
  const renderRegisterModal = () => {
    if (uiMode !== 'register') return null;

    return (
      <View style={[styles.modal, styles.modalContainer]}>
        <View style={styles.registerWrap}>
          <TouchableOpacity
            style={styles.registerBack}
            onPress={() => {
              setUiMode('search');
              setShowSearchResults(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="목록으로 돌아가기">
            <Text style={styles.registerBackText}>← 목록으로</Text>
          </TouchableOpacity>
          <Text style={styles.registerTitle}>새 매장 등록</Text>
          <Text style={styles.fieldLabel}>매장명 *</Text>
          <TextInput
            style={[styles.fieldInput, registerErrors.name ? styles.fieldInputError : undefined]}
            value={newStoreName}
            onChangeText={(v: string) => {
              setNewStoreName(v);
              if (v.trim()) setRegisterErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="예: 우리마트 광교점"
            placeholderTextColor={colors.gray400}
            accessibilityLabel="매장명"
            accessibilityHint="새 매장 이름을 입력하세요"
          />
          {registerErrors.name ? (
            <Text style={styles.fieldErrorText}>{registerErrors.name}</Text>
          ) : null}
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>주소 *</Text>
            <TouchableOpacity
              onPress={handleAutoFillAddress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="GPS로 주소 자동 채우기"
            >
              <Text style={styles.fieldAutoFillBtn}>GPS로 자동 채우기</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.fieldInput, registerErrors.address ? styles.fieldInputError : undefined]}
            value={newStoreAddress}
            onChangeText={(v: string) => {
              setNewStoreAddress(v);
              if (v.trim()) setRegisterErrors((prev) => ({ ...prev, address: undefined }));
            }}
            placeholder="예: 서울 강남구 테헤란로 123"
            placeholderTextColor={colors.gray400}
            accessibilityLabel="주소"
            accessibilityHint="매장 주소를 입력하세요"
          />
          {registerErrors.address ? (
            <Text style={styles.fieldErrorText}>{registerErrors.address}</Text>
          ) : null}
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>매장 유형</Text>
            {!showAddStoreType && (
              <TouchableOpacity
                onPress={() => setShowAddStoreType(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="새 카테고리 추가">
                <Text style={styles.fieldAutoFillBtn}>+ 추가</Text>
              </TouchableOpacity>
            )}
          </View>
          {showAddStoreType && (
            <View style={styles.addCategorySection}>
              <TextInput
                style={styles.fieldInput}
                value={newStoreTypeInput}
                onChangeText={setNewStoreTypeInput}
                placeholder="예: 약국, 편의마트, 백화점"
                placeholderTextColor={colors.gray400}
                accessibilityLabel="새 카테고리명"
                accessibilityHint="새 카테고리 이름을 입력하세요"
              />
              <View style={styles.addCategoryBtnRow}>
                <TouchableOpacity
                  style={[styles.addCategoryBtn, styles.addCategoryBtnConfirm]}
                  onPress={handleAddStoreType}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="카테고리 추가">
                  <Text style={styles.addCategoryBtnText}>추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addCategoryBtn, styles.addCategoryBtnCancel]}
                  onPress={() => {
                    setShowAddStoreType(false);
                    setNewStoreTypeInput('');
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="취소">
                  <Text style={styles.addCategoryBtnTextCancel}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.typeRow}>
            {storeTypes.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeChip, newStoreType === opt.value && styles.typeChipActive]}
                onPress={() => setNewStoreType(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`매장 유형 ${opt.label}`}
                accessibilityState={{ selected: newStoreType === opt.value }}>
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
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isCreating ? '등록 중' : '매장 등록하기'}>
            <Text style={styles.primaryBtnText}>{isCreating ? '등록 중...' : '등록하기'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── 리스트 아이템 ────────────────────────────────────────────────────────────

  const renderStoreItem = useCallback(({ item }: ListRenderItemInfo<NaverPlaceDocument>) => (
    <TouchableOpacity
      style={[styles.storeItem, selectedPlaceId === item.id && styles.storeItemActive]}
      onPress={() => handleSelectNaverPlace(item)}
      disabled={isSelectingPlace}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`매장 ${item.name} ${item.roadAddress || item.address}`}>
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

  // ─── 검색 결과 리스트 (모달 형태) ───────────────────────────────────────────────
  const renderSearchResultsModal = () => {
    if (!showSearchResults) return null;

    const renderStoreItem = ({ item }: ListRenderItemInfo<NaverPlaceDocument>) => (
      <TouchableOpacity
        style={[styles.storeItem, selectedPlaceId === item.id && styles.storeItemActive]}
        onPress={() => handleSelectNaverPlace(item)}
        disabled={isSelectingPlace}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`매장 ${item.name} ${item.roadAddress || item.address}`}>
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
    );

    const renderListEmpty = () => {
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
            <ActivityIndicator color={colors.primary} accessibilityLabel="검색 중" />
          </View>
        );
      }
      if (isNaverError) {
        return (
          <View style={styles.centeredPad}>
            <Text style={styles.emptyText}>검색에 실패했어요</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void refetchPlaces()} accessibilityRole="button" accessibilityLabel="다시 시도">
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
    };

    const renderListFooter = () => {
      return (
        <TouchableOpacity
          style={styles.registerFooter}
          onPress={() => {
            setShowSearchResults(false);
            setPendingPlace(null);
            const lat = gpsCoords?.latitude ?? initialRegionLat.current ?? 37.5665;
            const lng = gpsCoords?.longitude ?? initialRegionLng.current ?? 126.978;
            navigation.navigate('StoreRegister', { latitude: lat, longitude: lng });
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="매장 직접 등록">
          <Text style={styles.registerFooterText}>찾는 매장이 없어요 → 직접 등록</Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.searchResultsContainer} pointerEvents="box-none">
        <View style={styles.searchResultsContent}>
          <View style={styles.searchResultsHeader}>
            <TouchableOpacity
              onPress={() => setShowSearchResults(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="검색 닫기">
              <CloseIcon size={24} color={colors.gray600} />
            </TouchableOpacity>
          </View>
          <FlatList
            style={styles.flatList}
            data={naverPlaces ?? []}
            keyExtractor={(item: NaverPlaceDocument) => item.id}
            renderItem={renderStoreItem}
            ListHeaderComponent={
              dbStores && dbStores.length > 0 ? (
                <View>
                  <Text style={styles.searchSectionTitle}>앱에 등록된 매장</Text>
                  {dbStores.map(store => (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storeItem, styles.dbStoreItem]}
                      onPress={() => {
                        setStore(store.id, store.name);
                        setShowSearchResults(false);
                        navigation.navigate('InputMethod');
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`등록 매장 ${store.name}`}
                    >
                      <View style={[styles.storeIconBox, styles.dbStoreIconBox]}>
                        <StoreIcon size={18} color={colors.primary} />
                      </View>
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                        <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.searchSectionTitle}>네이버 지도 검색</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={
              (naverPlaces ?? []).length === 0
                ? styles.listContentEmpty
                : { paddingBottom: insets.bottom + spacing.xxl }
            }
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            bounces={true}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 지도 영역 */}
      <MapViewWrapper
        ref={mapRef}
        style={styles.map}
        initialCamera={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          zoom: 14,
        }}
        isShowLocationButton={false}
        isShowZoomControls={false}
        minZoom={10}
        maxZoom={18}
        mapType="Basic"
        locale="ko">
        {mapMarkers
          .filter(m => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude))
          .map(m => (
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

      {/* 상단 검색바 */}
      <View style={[styles.searchBarOverlay, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backFab}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기">
          <Text style={styles.backFabText}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={16} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              value={debouncedQuery}
              onChangeText={(text) => {
                setDebouncedQuery(text);
                // 검색 시작하면 확인 모달 닫기 (겹침 방지)
                if (pendingPlace) {
                  setPendingPlace(null);
                  setSelectedPlaceId(null);
                }
                setShowSearchResults(true);
              }}
              placeholder="네이버 지도에서 매장 검색"
              placeholderTextColor={colors.gray400}
              returnKeyType="search"
              autoFocus={false}
              accessibilityLabel="매장 검색"
              accessibilityHint="네이버 지도에서 매장을 검색하세요"
            />
            {debouncedQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setDebouncedQuery('');
                  setShowSearchResults(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="검색어 삭제">
                <CloseIcon size={16} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 감지된 매장 모달 */}
      {renderDetectedModal()}

      {/* 검색 매장 확인 모달 */}
      {renderPendingPlaceModal()}

      {/* 매장 등록 모달 */}
      {renderRegisterModal()}

      {/* 검색 결과 모달 */}
      {renderSearchResultsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  map: { flex: 1 },
  flatList: { flex: 1 },

  // ─── 상단 검색바 오버레이 ──────────────────────────────────────────────────────
  searchBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 40,
    zIndex: 40,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },

  backFab: {
    width: 40,
    height: 40,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backFabText: {
    ...typography.headingXl,
    lineHeight: 22,
  },

  // ─── 모달 ──────────────────────────────────────────────────────────────────────
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    backgroundColor: colors.modalOverlay,
  },
  searchResultsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    zIndex: 30,
    elevation: 30,
  },
  searchResultsContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusLg,
    borderTopRightRadius: spacing.radiusLg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
    justifyContent: 'flex-end',
  },

  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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
    borderRadius: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  retryText: {
    ...typography.tagText,
    color: colors.primary,
  },

  detectedWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusMd,
    borderTopRightRadius: spacing.radiusMd,
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
    borderRadius: spacing.radiusMd,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  detectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: spacing.radiusMd,
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
    borderRadius: spacing.radiusMd,
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
    borderRadius: spacing.radiusMd,
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
  searchSectionTitle: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.gray600,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
  },
  dbStoreItem: {
    backgroundColor: colors.primaryLight,
  },
  dbStoreIconBox: {
    backgroundColor: colors.white,
  },

  registerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusMd,
    borderTopRightRadius: spacing.radiusMd,
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
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  fieldAutoFillBtn: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  fieldInput: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldInputError: {
    borderColor: colors.danger,
  },
  fieldErrorText: {
    ...typography.bodySm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeChip: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusFull,
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
  addCategorySection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  addCategoryBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addCategoryBtn: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryBtnConfirm: {
    backgroundColor: colors.primary,
  },
  addCategoryBtnCancel: {
    backgroundColor: colors.gray200,
  },
  addCategoryBtnText: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.white,
  },
  addCategoryBtnTextCancel: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
});

export default StoreSelectScreen;
