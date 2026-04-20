import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { HomeScreenProps, MainTabParamList } from '../../navigation/types';
import { colors, priceTagGradients } from '../../theme';
import { spacing } from '../../theme/spacing';
import { typography, PJS } from '../../theme/typography';
import { useInfiniteRecentPrices } from '../../hooks/queries/usePrices';
import { useFlyers } from '../../hooks/queries/useFlyers';
import { useUnreadNotificationCount } from '../../hooks/queries/useNotifications';
import { useLocationStore } from '../../store/locationStore';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import BellIcon from '../../components/icons/BellIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import { PriceCard } from '../../components/price/PriceCard';
import { getPriceTagLabel } from '../../components/price/PriceTag';
import type { ProductPriceCard } from '../../types/api.types';
import { formatPrice, getDistanceM, formatRelativeTime } from '../../utils/format';
import { POPULAR_TAGS, DEFAULT_FLYER_STORE_NAME } from '../../utils/constants';

type Props = HomeScreenProps<'Home'>;

// ─── HomeScreen ───────────────────────────────────────────────────────────────
const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const rawRegionName = useLocationStore((s) => s.regionName);
  const regionName = rawRegionName ?? '내 동네';
  const isRegionNameMissing = rawRegionName === null;
  const userLat = useLocationStore((s) => s.latitude);
  const userLng = useLocationStore((s) => s.longitude);
  const radius = useLocationStore((s) => s.radius);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTagIdx, setActiveTagIdx] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const { data: flyersData } = useFlyers();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;

  const radiusLabel = radius >= 1000 ? `${Math.round(radius / 1000)}km` : `${radius}m`;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  const {
    data: recentData,
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteRecentPrices();

  const recentPrices = useMemo(() => {
    const all = recentData?.pages.flatMap((p) => p.data) ?? [];
    const seen = new Set<string>();
    return all.filter((p) => {
      if (seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });
  }, [recentData]);

  const nearbyPrices = useMemo(() => {
    if (recentPrices.length === 0) return [];
    const validPrices = recentPrices.filter(
      (p) => p.productName && p.minPrice != null && p.cheapestStore != null,
    );
    if (userLat == null || userLng == null) return validPrices;
    return validPrices.filter((p) => {
      const lat = p.cheapestStore?.latitude;
      const lng = p.cheapestStore?.longitude;
      if (lat == null || lng == null) return true;
      if (isNaN(lat) || isNaN(lng)) return true;
      const dist = getDistanceM(userLat, userLng, lat, lng);
      return !isNaN(dist) && dist <= radius;
    });
  }, [recentPrices, userLat, userLng, radius]);

  const featuredCard = useMemo(() => nearbyPrices[0] ?? null, [nearbyPrices]);
  const feedCards = useMemo(() => nearbyPrices.slice(1), [nearbyPrices]);

  const handleTagPress = useCallback(
    (tag: string, idx: number) => {
      setActiveTagIdx(idx);
      navigation.navigate('Search', { initialQuery: tag });
    },
    [navigation],
  );

  const handleCardPress = useCallback(
    (productId: string) => {
      const card = nearbyPrices.find((p) => p.productId === productId);
      if (!card) return;
      navigation.navigate('PriceCompare', {
        productId: card.productId,
        productName: card.productName,
      });
    },
    [navigation, nearbyPrices],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchRecent();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchRecent]);

  const handleNavigatePriceRegister = useCallback(() => {
    navigation
      .getParent<BottomTabNavigationProp<MainTabParamList>>()
      ?.navigate('PriceRegisterStack', { screen: 'StoreSelect' });
  }, [navigation]);

  const listHeader = useMemo(() => {
    return (
      <>
        {/* ── 히어로 그라디언트 카드 ── */}
        {!isRecentLoading && !isRecentError && featuredCard && (
          <HeroGradient card={featuredCard} onPress={handleCardPress} />
        )}

        {/* ── 인기 태그 (chips) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {POPULAR_TAGS.map((tag, idx) => {
            const active = activeTagIdx === idx;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => handleTagPress(tag, idx)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${tag} 태그 검색`}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 섹션 헤더 ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>근처 최저가</Text>
            <Text style={styles.sectionSub}>
              {nearbyPrices.length}개 매장 · 반경 {radiusLabel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
            activeOpacity={0.7}
            style={styles.sectionMoreBtn}
          >
            <Text style={styles.sectionMoreText}>전체 →</Text>
          </TouchableOpacity>
        </View>

        {/* 로딩 / 에러 / 빈 상태 */}
        {isRecentLoading && <SkeletonCard variant="price" />}
        {isRecentError && (
          <EmptyState
            icon={WifiOffIcon}
            title="불러올 수 없어요"
            subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
            action={{ label: '다시 시도', onPress: refetchRecent }}
          />
        )}
        {!isRecentLoading && !isRecentError && nearbyPrices.length === 0 && (
          <EmptyState
            icon={TagIcon}
            title="아직 우리 동네에 등록된 가격이 없어요"
            subtitle="첫 번째 가격을 등록하면 동네 사람들에게 도움이 돼요!"
            action={{
              label: '가격 등록하기',
              onPress: handleNavigatePriceRegister,
            }}
          />
        )}
      </>
    );
  }, [
    isRecentLoading,
    isRecentError,
    featuredCard,
    handleCardPress,
    activeTagIdx,
    handleTagPress,
    nearbyPrices.length,
    radiusLabel,
    navigation,
    refetchRecent,
    handleNavigatePriceRegister,
  ]);

  const listFooter = useMemo(() => {
    return (
      <>
        {isFetchingNextPage && (
          <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
        )}
        {/* 전단지 배너 */}
        <TouchableOpacity
          style={styles.flyerBanner}
          onPress={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate('Flyer', { screen: 'FlyerList' })
          }
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="오늘의 전단지 보기"
        >
          <View style={styles.flyerDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.flashBadgeText}>FLASH SALE</Text>
            <Text style={styles.flyerBannerTitle}>오늘의 전단지</Text>
            <Text style={styles.flyerBannerSub}>
              {flyersData?.[0]?.storeName ?? DEFAULT_FLYER_STORE_NAME} 최대 40% 할인
            </Text>
          </View>
          <Text style={styles.flyerChev}>›</Text>
        </TouchableOpacity>
      </>
    );
  }, [isFetchingNextPage, navigation, flyersData]);

  const containerStyle = useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: insets.bottom + spacing.tabBarContentHeight + spacing.xl },
    ],
    [insets.bottom],
  );

  const renderCard = useCallback(
    ({ item }: ListRenderItemInfo<ProductPriceCard>) => (
      <View style={styles.cardWrap}>
        <PriceCard item={item} onPress={handleCardPress} />
      </View>
    ),
    [handleCardPress],
  );

  return (
    <View style={containerStyle}>
      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.regionButton}
          activeOpacity={0.7}
          onPress={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate('MyPageStack', {
                screen: 'LocationSetup',
                params: { returnTo: 'mypage' },
              })
          }
          accessibilityRole="button"
          accessibilityLabel={`${regionName} 지역 변경`}
        >
          <MapPinIcon size={16} color={colors.primary} />
          <Text style={styles.regionText}>{regionName}</Text>
          <ChevronDownIcon size={13} color={colors.gray700} />
          <View style={styles.radiusPill}>
            <Text style={styles.radiusPillText}>{radiusLabel}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <SearchIcon size={20} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `알림 ${unreadCount}개 안읽음` : '알림'
            }
            onPress={() => navigation.navigate('Notifications')}
          >
            <BellIcon size={22} color={colors.black} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 검색바 ── */}
      <View style={styles.searchBarWrap}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="오늘 뭐 살까? 품목 검색"
        >
          <SearchIcon size={18} color={colors.gray400} />
          <Text style={styles.searchPlaceholder}>오늘 뭐 살까? · 품목 검색</Text>
        </TouchableOpacity>
      </View>

      {/* ── 동네 미설정 배너 ── */}
      {isRegionNameMissing && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate('MyPageStack', {
                screen: 'LocationSetup',
                params: { returnTo: 'mypage' },
              })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.locationBannerText}>
            내 동네를 설정하면 주변 가격을 볼 수 있어요
          </Text>
          <Text style={styles.locationBannerAction}>설정하기 →</Text>
        </TouchableOpacity>
      )}

      {/* ── 메인 피드 ── */}
      <FlatList
        ref={listRef}
        data={feedCards}
        keyExtractor={(item) => item.productId}
        renderItem={renderCard}
        contentContainerStyle={listContentStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={listHeader}
      />
    </View>
  );
};

// ─── HeroGradient ──────────────────────────────────────────────────────────
// screens-home.jsx의 HeroGradient 패턴을 PriceTag 시스템 색상으로 구현.
// 가격표 타입별 그라디언트 → 등록된 가격표 타입에 맞는 색상으로 히어로 카드 렌더링.
interface HeroGradientProps {
  card: ProductPriceCard;
  onPress: (productId: string) => void;
}

const HeroGradient = React.memo(({ card, onPress }: HeroGradientProps) => {
  const { priceTag, signals } = card;
  const gradient = priceTagGradients[priceTag.type];
  const tagLabel = getPriceTagLabel(priceTag);

  const originalPrice = priceTag.originalPrice;
  const savings =
    originalPrice && originalPrice > card.minPrice
      ? Math.round((1 - card.minPrice / originalPrice) * 100)
      : null;

  const range = signals.maxPrice - signals.minPrice;
  const positionPct =
    range > 0 ? ((card.minPrice - signals.minPrice) / range) * 100 : 0;

  return (
    <Pressable
      onPress={() => onPress(card.productId)}
      style={({ pressed }) => [styles.heroWrap, pressed && styles.heroPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${card.productName} 오늘의 최저가`}
    >
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* 장식 원 */}
        <View style={styles.heroDecorBig} />
        <View style={styles.heroDecorSm} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroTagBadge}>
            <Text style={styles.heroTagBadgeText}>{tagLabel}</Text>
          </View>
          <Text style={styles.heroTime}>· {formatRelativeTime(card.createdAt)}</Text>
        </View>

        <Text style={styles.heroProductName} numberOfLines={1}>
          {card.productName}
        </Text>
        <Text style={styles.heroStoreName} numberOfLines={1}>
          {card.cheapestStore?.name ?? '매장 정보 없음'}
        </Text>

        <View style={styles.heroPriceRow}>
          <Text style={styles.heroPrice}>{formatPrice(card.minPrice)}</Text>
          <Text style={styles.heroPriceUnit}>원</Text>
          {savings && (
            <View style={[styles.heroSavingsPill, { shadowColor: gradient[1] }]}>
              <Text style={[styles.heroSavingsText, { color: gradient[1] }]}>
                −{savings}%
              </Text>
            </View>
          )}
        </View>

        {range > 0 && (
          <>
            <View style={styles.heroBarTrack}>
              <View
                style={[
                  styles.heroBarFill,
                  { width: `${Math.max(6, 100 - positionPct)}%` },
                ]}
              />
            </View>
            <View style={styles.heroBarLabels}>
              <Text style={styles.heroBarLabel}>
                최저 {formatPrice(signals.minPrice)}
              </Text>
              <Text style={styles.heroBarLabel}>{signals.storeCount}곳 비교</Text>
              <Text style={styles.heroBarLabel}>
                최고 {formatPrice(signals.maxPrice)}
              </Text>
            </View>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ─── 헤더 ───────────────────────────────────────────────────────────
  header: {
    height: spacing.headerHeight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  regionText: {
    fontFamily: PJS.bold,
    fontSize: 16,
    color: colors.black,
    letterSpacing: -0.3,
  },
  radiusPill: {
    marginLeft: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.primaryLight,
  },
  radiusPillText: {
    fontFamily: PJS.bold,
    fontSize: 10,
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: PJS.bold,
    fontSize: 9,
    color: colors.white,
    letterSpacing: -0.2,
  },

  // ─── 검색바 ─────────────────────────────────────────────────────────
  searchBarWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: PJS.regular,
    fontSize: 14,
    color: colors.gray400,
  },

  // ─── 동네 배너 ──────────────────────────────────────────────────────
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  locationBannerText: {
    ...typography.bodySm,
    color: colors.primary,
    flex: 1,
  },
  locationBannerAction: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.primary,
    marginLeft: spacing.sm,
  },

  // ─── 리스트 ─────────────────────────────────────────────────────────
  listContent: {
    paddingTop: spacing.sm,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
  },

  // ─── 히어로 그라디언트 ──────────────────────────────────────────────
  heroWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.shadowBase,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroPressed: {
    opacity: 0.94,
  },
  heroCard: {
    padding: 22,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecorBig: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.flyerCircleOverlay,
  },
  heroDecorSm: {
    position: 'absolute',
    right: 30,
    bottom: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.flyerCircleOverlayFaint,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTagBadge: {
    backgroundColor: colors.onGradientChip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroTagBadgeText: {
    fontFamily: PJS.extraBold,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 1.5,
  },
  heroTime: {
    fontFamily: PJS.regular,
    fontSize: 10,
    color: colors.onGradientTextMuted,
  },
  heroProductName: {
    fontFamily: PJS.extraBold,
    fontSize: 20,
    color: colors.white,
    letterSpacing: -0.4,
    marginTop: 12,
  },
  heroStoreName: {
    fontFamily: PJS.regular,
    fontSize: 11,
    color: colors.bannerTextMuted,
    marginTop: 2,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
    gap: 8,
  },
  heroPrice: {
    fontFamily: PJS.extraBold,
    fontSize: 42,
    color: colors.white,
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  heroPriceUnit: {
    fontFamily: PJS.bold,
    fontSize: 16,
    color: colors.onGradientTextStrong,
  },
  heroSavingsPill: {
    marginLeft: 'auto',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.radiusFull,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  heroSavingsText: {
    fontFamily: PJS.extraBold,
    fontSize: 11,
  },
  heroBarTrack: {
    marginTop: 14,
    height: 5,
    backgroundColor: colors.onGradientChip,
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroBarFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  heroBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  heroBarLabel: {
    fontFamily: PJS.bold,
    fontSize: 10,
    color: colors.onGradientTextBase,
  },

  // ─── 인기 태그 ──────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tagChip: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusFull,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontFamily: PJS.semiBold,
    fontSize: 13,
    color: colors.gray700,
  },
  tagTextActive: {
    color: colors.white,
  },

  // ─── 섹션 헤더 ──────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: PJS.extraBold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: PJS.regular,
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  sectionMoreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    backgroundColor: colors.white,
  },
  sectionMoreText: {
    fontFamily: PJS.bold,
    fontSize: 12,
    color: colors.primary,
  },

  // ─── 전단지 배너 ────────────────────────────────────────────────────
  flyerBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.flyerBannerBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  flyerDot: {
    position: 'absolute',
    right: -30,
    bottom: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.flyerPrimaryDotOverlay,
  },
  flashBadgeText: {
    fontFamily: PJS.extraBold,
    fontSize: 10,
    color: colors.tertiaryFixedDim,
    letterSpacing: 2,
    marginBottom: 4,
  },
  flyerBannerTitle: {
    fontFamily: PJS.extraBold,
    fontSize: 18,
    color: colors.white,
    letterSpacing: -0.4,
  },
  flyerBannerSub: {
    fontFamily: PJS.regular,
    fontSize: 12,
    color: colors.onGradientTextSubtle,
    marginTop: 3,
  },
  flyerChev: {
    fontSize: 24,
    color: colors.white,
    fontFamily: PJS.bold,
  },
});

export default HomeScreen;
