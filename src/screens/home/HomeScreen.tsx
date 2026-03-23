import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useRecentPrices } from '../../hooks/queries/usePrices';
import { useLocationStore } from '../../store/locationStore';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import BellIcon from '../../components/icons/BellIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import type { PriceResponse } from '../../types/api.types';
import { formatPrice, formatRelativeTime, getDistanceM, formatDistance } from '../../utils/format';
import { POPULAR_TAGS, AD_BANNER_PLACEHOLDER } from '../../utils/constants';
import { API_BASE_URL } from '../../utils/config';

type Props = HomeScreenProps<'Home'>;


// 최근 가격을 상품별로 그룹화하여 카드 데이터 생성
interface PriceCardData {
  productId: string;
  productName: string;
  unitType: string;
  storeName: string;
  distance: string;
  time: string;
  minPrice: number;
  maxPrice: number;
  storeCount: number;
  hasClosingDiscount: boolean;
  imageUrl: string | null;
  quantity: number | null;
  registrantNickname: string | null;
  registrantProfileImage: string | null;
}

const groupPricesByProduct = (
  prices: PriceResponse[],
  userLat?: number,
  userLng?: number,
): PriceCardData[] => {
  // 상품 이름 기준으로 그룹화 (같은 이름이면 같은 카드로 묶임)
  const map = new Map<string, PriceResponse[]>();
  prices.forEach((p) => {
    if (!p.product?.name) return; // product가 없으면 스킵
    const key = p.product.name.trim().toLowerCase();
    const group = map.get(key) ?? [];
    group.push(p);
    map.set(key, group);
  });

  return Array.from(map.values()).map((group) => {
    const sorted = [...group].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const pricelist = sorted.map((p) => p.price);
    const distanceText =
      userLat != null &&
      userLng != null &&
      cheapest.store?.latitude != null &&
      cheapest.store?.longitude != null
        ? formatDistance(getDistanceM(userLat, userLng, cheapest.store.latitude, cheapest.store.longitude))
        : '-';
    return {
      productId: cheapest.product?.id ?? '',
      productName: cheapest.product?.name ?? '알 수 없음',
      unitType: cheapest.product?.unitType ?? 'other',
      storeName: cheapest.store?.name ?? '매장 정보 없음',
      distance: distanceText,
      time: formatRelativeTime(cheapest.createdAt),
      minPrice: Math.min(...pricelist),
      maxPrice: Math.max(...pricelist),
      storeCount: group.length,
      hasClosingDiscount: group.some(
        (p) => p.condition != null && p.condition.includes('마감'),
      ),
      imageUrl: cheapest.imageUrl || null,
      quantity: cheapest.quantity,
      registrantNickname: cheapest.user?.nickname || null,
      registrantProfileImage: cheapest.user?.profileImageUrl || null,
    };
  });
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const regionName = useLocationStore((s) => s.regionName) ?? '내 동네';
  const userLat = useLocationStore((s) => s.latitude);
  const userLng = useLocationStore((s) => s.longitude);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: recentPrices,
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
  } = useRecentPrices();

  const radius = useLocationStore((s) => s.radius);

  // 설정된 동네 기준으로 반경 내 가격만 필터링
  const nearbyPrices = useMemo(() => {
    if (!recentPrices) return [];
    if (userLat == null || userLng == null) return recentPrices;
    return recentPrices.filter((p) => {
      if (!p.store || p.store.latitude == null || p.store.longitude == null) return true;
      if (isNaN(p.store.latitude) || isNaN(p.store.longitude)) return true;
      const dist = getDistanceM(userLat, userLng, p.store.latitude, p.store.longitude);
      return !isNaN(dist) && dist <= radius;
    });
  }, [recentPrices, userLat, userLng, radius]);

  const priceCards = useMemo(
    () => groupPricesByProduct(nearbyPrices, userLat ?? undefined, userLng ?? undefined),
    [nearbyPrices, userLat, userLng],
  );

  const handleTagPress = useCallback((tag: string) => {
    navigation.navigate('Search', { initialQuery: tag });
  }, [navigation]);

  const handleCardPress = useCallback(
    (card: PriceCardData) => {
      navigation.navigate('PriceCompare', {
        productId: card.productId,
        productName: card.productName,
      });
    },
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchRecent();
    setIsRefreshing(false);
  }, [refetchRecent]);


  const ListHeader = useCallback(
    () => (
      <>
        {/* 인기 태그 */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
          >
            {POPULAR_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${tag} 태그 검색`}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 광고 배너 */}
        <View style={styles.adBanner}>
          <View style={styles.adStoreIcon}>
            <StoreIcon size={spacing.iconSm} color={colors.adText} />
          </View>
          <View style={styles.adContent}>
            <Text style={styles.adStoreName}>{AD_BANNER_PLACEHOLDER.storeName}</Text>
            <Text style={styles.adInfo}>{AD_BANNER_PLACEHOLDER.info}</Text>
          </View>
          <Text style={styles.adBadge}>AD</Text>
        </View>

        {/* 섹션 제목 */}
        <Text style={styles.sectionTitle}>내 동네 실시간 가격</Text>

        {/* 로딩 / 에러 상태 */}
        {isRecentLoading && <SkeletonCard variant="price" />}
        {isRecentError && (
          <EmptyState
            icon={WifiOffIcon}
            title="불러올 수 없어요"
            subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
            action={{ label: '다시 시도', onPress: refetchRecent }}
          />
        )}
        {!isRecentLoading && !isRecentError && priceCards.length === 0 && (
          <EmptyState
            icon={TagIcon}
            title="아직 등록된 가격이 없어요"
            subtitle="이 동네 첫 가격을 등록해 보세요!"
          />
        )}
      </>
    ),
    [handleTagPress, isRecentLoading, isRecentError, priceCards.length, refetchRecent],
  );

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: insets.bottom + spacing.tabBarContentHeight + spacing.md },
    ],
    [insets.bottom],
  );


  // ─── 이미지 URL 보정 (에뮬레이터 주소 → 실제 서버) ─────────────────────
  const fixImageUrl = useCallback((url: string | null): string | null => {
    if (!url || url.length === 0) return null;
    if (url.startsWith('http')) {
      return url.replace(/http:\/\/10\.0\.2\.2:\d+/, API_BASE_URL);
    }
    return `${API_BASE_URL}/${url}`;
  }, []);

  // ─── 가격 카드 ─────────────────────────────────────────────────────────
  const renderPriceCard = useCallback(
    ({ item }: ListRenderItemInfo<PriceCardData>) => {
      const imageUri = fixImageUrl(item.imageUrl);

      return (
        <Pressable
          style={({ pressed }) => [styles.priceCard, pressed && styles.priceCardPressed]}
          onPress={() => handleCardPress(item)}
          android_ripple={{ color: colors.gray200 }}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} ${item.minPrice}원`}
        >
          {/* 왼쪽: 이미지 썸네일 */}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.cardImage}
              resizeMode="cover"
              accessible={true}
              accessibilityLabel={`${item.productName} 상품 이미지`}
            />
          ) : (
            <View style={styles.cardImagePlaceholder} accessible={true} accessibilityLabel="상품 이미지 없음">
              <TagIcon size={28} color={colors.gray400} />
            </View>
          )}

          {/* 오른쪽: 정보 */}
          <View style={styles.cardContent}>
            {/* 상품명 + 수량 */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardProductName} numberOfLines={1}>
                {item.productName}
                {item.quantity ? <Text style={styles.cardQuantity}> {item.quantity}개</Text> : null}
              </Text>
              {item.hasClosingDiscount && (
                <View style={styles.closingBadge}>
                  <Text style={styles.closingBadgeText}>마감</Text>
                </View>
              )}
            </View>

            {/* 가격 */}
            <Text style={styles.cardMinPrice}>
              {formatPrice(item.minPrice)}
              {item.storeCount > 1 && item.maxPrice > item.minPrice && (
                <Text style={styles.cardMaxPrice}> ~ {formatPrice(item.maxPrice)}</Text>
              )}
            </Text>

            {/* 매장 · 거리 · 시간 */}
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.storeName} · {item.distance} · {item.time}
            </Text>

            {/* 등록자 닉네임 */}
            {item.registrantNickname && (
              <Text style={styles.cardRegistrant} numberOfLines={1}>
                by {item.registrantNickname}
              </Text>
            )}

            {/* 비교 */}
            <Text style={styles.cardCompare}>
              {item.storeCount}곳 비교 {'>'}
            </Text>
          </View>
        </Pressable>
      );
    },
    [handleCardPress, fixImageUrl],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── 헤더 ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.regionButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MyPageStack', { screen: 'LocationSetup', params: { returnTo: 'mypage' } })}
          accessibilityRole="button"
          accessibilityLabel={`${regionName} 지역 변경`}
        >
          <Text style={styles.regionText}>{regionName}</Text>
          <ChevronDownIcon size={14} color={colors.black} />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <SearchIcon size={22} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="알림"
            onPress={() => Alert.alert('알림', '알림 기능이 곧 추가될 예정이에요!')}
          >
            <View>
              <BellIcon size={22} color={colors.black} />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 검색바 ──────────────────────────────────────────────────── */}
      <View style={styles.searchBarWrap}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="상품 이름을 검색하세요"
        >
          <SearchIcon size={18} color={colors.gray400} />
          <Text style={styles.searchPlaceholder}>상품 이름을 검색하세요</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 메인 콘텐츠 ─────────────────────────────────────────── */}
      <FlatList
          data={priceCards}
          keyExtractor={(item) => item.productId}
          renderItem={renderPriceCard}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={ListHeader}
        />

      {/* FAB 제거됨 — 등록은 하단 탭의 "등록" 버튼으로 접근 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },

  // ─── 헤더 ─────────────────────────────────────────────────────────────
  header: {
    height: spacing.headerHeight,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  regionText: {
    ...typography.headingXl,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: spacing.notifDotSize,
    height: spacing.notifDotSize,
    borderRadius: spacing.xs,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.white,
  },

  // ─── 검색바 ───────────────────────────────────────────────────────────
  searchBarWrap: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.gray400,
  },

  // ─── 리스트 ────────────────────────────────────────────────────────────
  listContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: 0,
    gap: spacing.sm,
  },

  // ─── 인기 태그 ─────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing.lg,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.micro,
  },
  tagChip: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    ...typography.tagText,
    fontWeight: '500' as const,
  },

  // ─── 광고 배너 ─────────────────────────────────────────────────────────
  adBanner: {
    backgroundColor: colors.adBg,
    borderRadius: spacing.radiusMd,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  adStoreIcon: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adStoreEmoji: {
    fontSize: spacing.xxl,
  },
  adContent: {
    flex: 1,
  },
  adStoreName: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.gray900,
    marginBottom: spacing.micro,
  },
  adInfo: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  adBadge: {
    position: 'absolute',
    top: 10,
    right: spacing.md,
    ...typography.captionBold,
    color: colors.adText,
  },

  // ─── 섹션 제목 ─────────────────────────────────────────────────────────
  sectionTitle: {
    ...typography.headingXl,
    fontWeight: '700' as const,
    color: colors.black,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },

  // ─── 가격 카드 (당근마켓 스타일: 구분선, 그림자 없음, 촘촘) ──────────
  priceCard: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    borderRadius: spacing.radiusLg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  priceCardPressed: {
    opacity: 0.9,
  },
  cardImage: {
    width: spacing.cardImageSize,
    height: spacing.cardImageSize,
    borderRadius: spacing.radiusMd,
    margin: spacing.md,
  },
  cardImagePlaceholder: {
    width: spacing.cardImageSize,
    height: spacing.cardImageSize,
    borderRadius: spacing.radiusMd,
    margin: spacing.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardProductName: {
    ...typography.headingLg,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardQuantity: {
    ...typography.bodySm,
    color: colors.gray600,
    fontWeight: '400' as const,
  },
  cardMinPrice: {
    ...typography.price,
    marginBottom: 2,
  },
  cardMaxPrice: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '400' as const,
  },
  cardMeta: {
    ...typography.bodySm,
    color: colors.gray600,
    marginBottom: 2,
  },
  cardRegistrant: {
    ...typography.caption,
    color: colors.gray400,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  cardCompare: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.primary,
  },

  // ─── 마감할인 뱃지 ──────────────────────────────────────────────────────
  closingBadge: {
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  closingBadgeText: {
    ...typography.caption,
    fontWeight: '700' as const,
    color: colors.danger,
  },

  // ─── FAB ───────────────────────────────────────────────────────────────
  fabShadow: {
    position: 'absolute',
    right: spacing.fabRight,
    width: spacing.fabSize,
    height: spacing.fabSize,
    borderRadius: spacing.radiusLg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fab: {
    flex: 1,
    borderRadius: spacing.radiusLg,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  fabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
