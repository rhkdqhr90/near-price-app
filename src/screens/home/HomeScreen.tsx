import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { HomeScreenProps, MainTabParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, PJS } from '../../theme/typography';
import { useInfiniteRecentPrices } from '../../hooks/queries/usePrices';
import { useFlyers } from '../../hooks/queries/useFlyers';
import { useAddWishlist } from '../../hooks/queries/useWishlist';
import { useLocationStore } from '../../store/locationStore';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import BellIcon from '../../components/icons/BellIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import type { ProductPriceCard } from '../../types/api.types';
import { formatPrice, getDistanceM, fixImageUrl, formatRelativeTime } from '../../utils/format';
import { POPULAR_TAGS } from '../../utils/constants';

type Props = HomeScreenProps<'Home'>;

const GRID_GAP = spacing.cardGap;
const GRID_PADDING = spacing.lg;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const rawRegionName = useLocationStore((s) => s.regionName);
  const regionName = rawRegionName ?? '내 동네';
  const isRegionNameMissing = rawRegionName === null;
  const userLat = useLocationStore((s) => s.latitude);
  const userLng = useLocationStore((s) => s.longitude);
  const radius = useLocationStore((s) => s.radius);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList>(null);
  const { mutate: addWishlist } = useAddWishlist();
  const { data: flyersData } = useFlyers();

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

  const recentPrices = useMemo(
    () => recentData?.pages.flatMap(p => p.data) ?? [],
    [recentData],
  );

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
  const gridCards = useMemo(() => nearbyPrices.slice(1), [nearbyPrices]);

  const handleTagPress = useCallback((tag: string) => {
    navigation.navigate('Search', { initialQuery: tag });
  }, [navigation]);

  const handleCardPress = useCallback(
    (card: ProductPriceCard) => {
      navigation.navigate('PriceCompare', {
        productId: card.productId,
        productName: card.productName,
      });
    },
    [navigation],
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
    navigation.getParent()?.navigate('PriceRegisterStack', { screen: 'StoreSelect' });
  }, [navigation]);

  const featuredImageUri = useMemo(
    () => (featuredCard ? fixImageUrl(featuredCard.imageUrl) : null),
    [featuredCard],
  );

  const listHeader = useMemo(() => {
    return (
      <>
        {/* ── 인기 태그 ── */}
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

        {/* ── 히어로 카드 ── */}
        {!isRecentLoading && !isRecentError && featuredCard && (
          <Pressable
            style={({ pressed }) => [styles.heroCard, pressed && styles.heroCardPressed]}
            onPress={() => handleCardPress(featuredCard)}
            accessibilityRole="button"
            accessibilityLabel={`${featuredCard.productName} 이웃 추천 상품`}
          >
            {/* 이미지 영역 */}
            <View style={styles.heroImageWrap}>
              {featuredImageUri ? (
                <Image
                  source={{ uri: featuredImageUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                  accessible={true}
                  accessibilityLabel={`${featuredCard.productName} 상품 이미지`}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primaryDark, colors.primary]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              {/* 이웃 인증 배지 */}
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>✓ 이웃 인증됨</Text>
              </View>
              {featuredCard.hasClosingDiscount && (
                <View style={styles.heroClosingBadge}>
                  <Text style={styles.heroClosingBadgeText}>마감할인</Text>
                </View>
              )}
            </View>

            {/* 텍스트 영역 */}
            <View style={styles.heroBody}>
              {/* 2열: 상품정보 ← → 가격 */}
              <View style={styles.heroRow}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroProductName} numberOfLines={2}>
                    {featuredCard.productName}
                  </Text>
                  <Text style={styles.heroStoreName} numberOfLines={1}>
                    {featuredCard.cheapestStore?.name ?? '매장 정보 없음'}
                  </Text>
                  <Text style={styles.heroTime}>• {formatRelativeTime(featuredCard.createdAt)}</Text>
                </View>
                <View style={styles.heroRight}>
                  <View style={styles.heroPriceRow}>
                    <Text style={styles.heroPrice}>
                      {featuredCard.minPrice.toLocaleString()}
                    </Text>
                    <Text style={styles.heroPriceUnit}>원</Text>
                  </View>
                  {featuredCard.storeCount > 1 && (
                    <Text style={styles.heroLowestLabel}>7일 최저가</Text>
                  )}
                </View>
              </View>

              {/* 구분선 + Reported by + 가격보기 버튼 */}
              <View style={styles.heroDivider} />
              <View style={styles.heroFooter}>
                <View style={styles.heroReporterRow}>
                  <View style={styles.heroAvatar}>
                    {featuredCard.registrant?.profileImageUrl ? (
                      <Image
                        source={{ uri: fixImageUrl(featuredCard.registrant.profileImageUrl) ?? '' }}
                        style={styles.heroAvatarImage}
                        resizeMode="cover"
                        accessible={false}
                      />
                    ) : (
                      <Text style={styles.heroAvatarEmoji}>🧑</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.heroReportedBy}>Reported by</Text>
                    <Text style={styles.heroReporterName}>
                      {featuredCard.registrant?.nickname ?? '이웃'} · Top Contributor
                    </Text>
                  </View>
                </View>
                <View style={styles.heroViewBtn}>
                  <Text style={styles.heroViewBtnText}>가격 보기</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}

        {/* ── 오늘의 전단지 배너 (항상 표시) ── */}
        <TouchableOpacity
          style={styles.flyerBanner}
          onPress={() => navigation.getParent()?.navigate('Flyer', { screen: 'FlyerList' })}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="오늘의 전단지 보기"
        >
          {/* FLASH SALE 배지 */}
          <View style={styles.flashBadgeWrap}>
            <View style={styles.flashBadge}>
              <Text style={styles.flashBadgeText}>FLASH SALE</Text>
            </View>
          </View>
          <Text style={styles.flyerBannerTitle}>오늘의 전단지</Text>
          <Text style={styles.flyerBannerSub}>
            {flyersData?.[0]?.storeName ?? '마실 동네마트'} 최대 40% 할인
          </Text>

          {/* 팬아웃 카드 3장 (고정 이모지) */}
          <View style={styles.flyerFanWrap}>
            <View style={[styles.flyerFanCard, styles.flyerFanLeft]}>
              <Text style={styles.flyerFanEmoji}>🥦</Text>
            </View>
            <View style={[styles.flyerFanCard, styles.flyerFanCenter]}>
              <Text style={styles.flyerFanEmoji}>🥩</Text>
            </View>
            <View style={[styles.flyerFanCard, styles.flyerFanRight]}>
              <Text style={styles.flyerFanEmoji}>🍎</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── 최근 등록 가격 섹션 헤더 ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>최근 등록 가격</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="전체보기"
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
    handleTagPress,
    isRecentLoading,
    isRecentError,
    nearbyPrices,
    refetchRecent,
    navigation,
    featuredCard,
    featuredImageUri,
    handleCardPress,
    handleNavigatePriceRegister,
    flyersData,
  ]);

  const listContentPaddingStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + spacing.tabBarContentHeight + spacing.xl }),
    [insets.bottom],
  );

  const renderGridCard = useCallback(
    ({ item }: ListRenderItemInfo<ProductPriceCard>) => {
      const imageUri = fixImageUrl(item.imageUrl);
      return (
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.gridCardPressed]}
          onPress={() => handleCardPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} ${formatPrice(item.minPrice)}`}
        >
          {/* 내부 이미지 (자체 rounded border) */}
          <View style={styles.gridImageInner}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={`${item.productName} 상품 이미지`}
              />
            ) : (
              <View style={styles.gridImagePlaceholder}>
                <TagIcon size={26} color={colors.gray400} />
              </View>
            )}
            {/* 마감할인 배지 */}
            {item.hasClosingDiscount && (
              <View style={styles.gridDiscountBadge}>
                <Text style={styles.gridDiscountBadgeText}>마감</Text>
              </View>
            )}
            {/* 매장 수 배지 */}
            {item.storeCount > 1 && (
              <View style={styles.gridStoreCountBadge}>
                <Text style={styles.gridStoreCountBadgeText}>{item.storeCount}곳</Text>
              </View>
            )}
            {/* 가격 오버레이 (이미지 하단 좌측) */}
            <View style={styles.gridPriceOverlay}>
              <Text style={styles.gridPriceOverlayText}>
                {item.minPrice.toLocaleString()}원
              </Text>
            </View>
          </View>

          {/* 텍스트 영역 (카드 패딩 영역 안) */}
          <View style={styles.gridTextWrap}>
            <Text style={styles.gridProductName} numberOfLines={1}>
              {item.productName}
            </Text>
            {/* 인증된 가격 배지 */}
            <View style={styles.gridVerifiedRow}>
              <Text style={styles.gridVerifiedText}>✓ 인증된 가격</Text>
            </View>
            {/* 등록자 */}
            {item.registrant && (
              <View style={styles.gridRegistrantRow}>
                <Text style={styles.gridRegistrantText}>👤 {item.registrant.nickname}</Text>
              </View>
            )}
            {/* 매장명 + 찜(+) 버튼 */}
            <View style={styles.gridBottomRow}>
              <View style={styles.gridStoreRow}>
                <StoreIcon size={10} color={colors.outlineColor} />
                <Text style={styles.gridStoreName} numberOfLines={1}>
                  {item.cheapestStore?.name ?? '매장 정보 없음'}
                </Text>
              </View>
              <Pressable
                style={styles.gridAddBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  addWishlist(item.productId);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.productName} 찜하기`}
              >
                <Text style={styles.gridAddBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleCardPress, addWishlist],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.regionButton}
          activeOpacity={0.7}
          onPress={() => navigation.getParent()?.navigate('MyPageStack', { screen: 'LocationSetup', params: { returnTo: 'mypage' } })}
          accessibilityRole="button"
          accessibilityLabel={`${regionName} 지역 변경`}
        >
          <MapPinIcon size={16} color={colors.primary} />
          <Text style={styles.regionText}>{regionName}</Text>
          <ChevronDownIcon size={13} color={colors.gray700} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.brandText}>마실</Text>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="알림"
            onPress={() => navigation.getParent<BottomTabNavigationProp<MainTabParamList>>()?.navigate('MyPageStack', {
              screen: 'NotificationSettings',
            })}
          >
            <BellIcon size={22} color={colors.black} />
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
          accessibilityLabel="상품 이름을 검색하세요"
        >
          <SearchIcon size={18} color={colors.gray400} />
          <Text style={styles.searchPlaceholder}>상품 이름을 검색하세요</Text>
          <View style={styles.radiusPill}>
            <Text style={styles.radiusPillText}>반경 {radiusLabel}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 동네 미설정 배너 ── */}
      {isRegionNameMissing && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => navigation.getParent()?.navigate('MyPageStack', { screen: 'LocationSetup', params: { returnTo: 'mypage' } })}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="동네 설정하기"
        >
          <Text style={styles.locationBannerText}>내 동네를 설정하면 주변 가격을 볼 수 있어요</Text>
          <Text style={styles.locationBannerAction}>설정하기 →</Text>
        </TouchableOpacity>
      )}

      {/* ── 메인 콘텐츠 ── */}
      <FlatList
        ref={listRef}
        data={gridCards}
        numColumns={2}
        keyExtractor={(item) => item.productId}
        renderItem={renderGridCard}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.listContent, listContentPaddingStyle]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null}
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
    paddingHorizontal: spacing.xl,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.surfaceContainer,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  regionText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.tertiary,
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── 검색바 ─────────────────────────────────────────────────────────
  searchBarWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.gray400,
  },
  radiusPill: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },

  // ─── 동네 배너 ──────────────────────────────────────────────────────
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xl,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
  },

  // ─── 인기 태그 ──────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tagChip: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
  tagTextActive: {
    color: colors.white,
    fontWeight: '700' as const,
  },

  // ─── 섹션 헤더 ──────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  sectionMoreText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.primary,
  },

  // ─── 히어로 카드 ────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: spacing.shadowOffsetY },
    shadowOpacity: 0.08,
    shadowRadius: spacing.shadowRadiusLg,
    elevation: 4,
    borderWidth: spacing.borderThin,
    borderColor: colors.outlineVariant,
  },
  heroCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  // 이미지: 16:9 비율 (이미지 높이 축소)
  heroImageWrap: {
    width: '100%',
    aspectRatio: 1.78,
    backgroundColor: colors.surfaceContainerLow,
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.midnightMint,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
    letterSpacing: 0.2,
  },
  heroClosingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroClosingBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
  },
  heroBody: {
    padding: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroLeft: {
    flex: 1,
  },
  heroProductName: {
    fontFamily: PJS.extraBold,
    fontSize: 16,
    color: colors.black,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  heroStoreName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.micro,
  },
  heroTime: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: colors.outlineColor,
  },
  heroRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '45%',  // 좁은 기기에서 가격 영역이 상품명을 과도하게 압축하지 않도록
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.micro,
  },
  heroPrice: {
    ...typography.price,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heroPriceUnit: {
    fontFamily: PJS.bold,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  heroLowestLabel: {
    fontSize: 9,
    fontWeight: '900' as const,
    color: colors.danger,
    letterSpacing: -0.2,
    marginTop: spacing.xs,
  },
  heroDivider: {
    height: spacing.borderThin,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroReporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.tertiaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  heroAvatarEmoji: {
    fontSize: 15,
  },
  heroReportedBy: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: colors.outlineColor,
    lineHeight: 14,
  },
  heroReporterName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  heroViewBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + spacing.micro,
  },
  heroViewBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.white,
  },

  // ─── 전단지 배너 ────────────────────────────────────────────────────
  flyerBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    backgroundColor: colors.flyerBannerBg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  flashBadgeWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flashBadge: {
    backgroundColor: colors.tertiaryFixedDim,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  flashBadgeText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: colors.onTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  flyerBannerTitle: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: colors.white,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  flyerBannerSub: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.flyerSubtitleTextDim,
    textAlign: 'center' as const,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  // 팬아웃 카드 컨테이너
  flyerFanWrap: {
    height: 120,
    position: 'relative',
  },
  flyerFanCard: {
    position: 'absolute',
    width: '40%',
    aspectRatio: 4 / 3,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  flyerFanLeft: {
    left: '4%',
    top: '15%',
    backgroundColor: colors.flyerFanBgLeft,
    transform: [{ rotate: '-13deg' }],
    zIndex: 1,
  },
  flyerFanCenter: {
    left: '28%',
    top: '2%',
    backgroundColor: colors.flyerFanBgCenter,
    transform: [{ rotate: '-1deg' }],
    zIndex: 3,
    width: '44%',
  },
  flyerFanRight: {
    right: '4%',
    top: '15%',
    backgroundColor: colors.flyerFanBgRight,
    transform: [{ rotate: '11deg' }],
    zIndex: 2,
  },
  flyerFanEmoji: {
    fontSize: 28,
  },

  // ─── 2열 그리드 카드 ────────────────────────────────────────────────
  gridRow: {
    gap: GRID_GAP,
    paddingHorizontal: GRID_PADDING,
    marginBottom: spacing.md,
  },
  // 외부 카드: bg=surfaceContainerLow, 패딩 10, rounded 16
  gridCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusLg,
    padding: spacing.sm + spacing.micro,  // 10px
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: spacing.shadowOffsetY },
    shadowOpacity: 0.06,
    shadowRadius: spacing.shadowRadiusMd,
    elevation: 2,
  },
  gridCardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.99 }],
  },
  // 내부 이미지: 자체 rounded(8) border, 72% 비율
  gridImageInner: {
    width: '100%',
    aspectRatio: 1 / 0.72,
    borderRadius: spacing.radiusSm + 2,  // 8px
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  gridImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 가격 오버레이 (이미지 하단 좌측 pill)
  gridPriceOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.priceBadgeBg,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  gridPriceOverlayText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  gridDiscountBadgeText: {
    fontSize: 9,
    fontWeight: '900' as const,
    color: colors.white,
  },
  gridStoreCountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.distanceBadgeBg,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  gridStoreCountBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.white,
  },
  // 텍스트 영역
  gridTextWrap: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.micro,
  },
  gridProductName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.black,
    lineHeight: 18,
    marginBottom: spacing.micro,
  },
  gridVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gridVerifiedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.success,
  },
  gridRegistrantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gridRegistrantText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.outlineColor,
  },
  gridBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.micro,
    flex: 1,
  },
  gridStoreName: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.outlineColor,
    flex: 1,
  },
  gridAddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gridAddBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    lineHeight: 20,
  },
});

export default HomeScreen;
