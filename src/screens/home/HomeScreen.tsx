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
import { typography } from '../../theme/typography';
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
import HeartIcon from '../../components/icons/HeartIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import type { ProductPriceCard } from '../../types/api.types';
import { formatPrice, getDistanceM, formatDistance, fixImageUrl } from '../../utils/format';
import { POPULAR_TAGS } from '../../utils/constants';

type Props = HomeScreenProps<'Home'>;

const GRID_GAP = spacing.sm;
const GRID_PADDING = spacing.lg;


const FLYER_GRAD_COLORS: Array<[string, string]> = [
  [colors.accent, colors.primary],
  [colors.olive, colors.oliveDark],
  [colors.midnightMint, colors.midnightMintDark],
];

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

    // 필수 데이터 누락 아이템 제외 — 빈 카드 방지
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

  // useMemo로 JSX element 직접 반환 — useCallback(component) 패턴은 ref 변경 시
  // FlatList가 ListHeader를 unmount/remount하므로 ReactElement 방식이 안전함
  const listHeader = useMemo(() => {
    const featuredDist =
      featuredCard != null &&
      userLat != null &&
      userLng != null &&
      featuredCard.cheapestStore?.latitude != null &&
      featuredCard.cheapestStore?.longitude != null
        ? formatDistance(
            getDistanceM(
              userLat,
              userLng,
              featuredCard.cheapestStore.latitude,
              featuredCard.cheapestStore.longitude,
            ),
          )
        : '-';
    return (
      <>
        {/* 인기 태그 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {POPULAR_TAGS.map((tag, index) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, index === 0 && styles.tagChipActive]}
              onPress={() => handleTagPress(tag)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${tag} 태그 검색`}
            >
              <Text style={[styles.tagText, index === 0 && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 이웃 즐겨찾기 */}
        {!isRecentLoading && !isRecentError && featuredCard && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>이웃 즐겨찾기</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.featuredCard, pressed && styles.featuredCardPressed]}
              onPress={() => handleCardPress(featuredCard)}
              accessibilityRole="button"
              accessibilityLabel={`${featuredCard.productName} 이웃 추천 상품`}
            >
              <View style={styles.featuredImageWrap}>
                {featuredImageUri ? (
                  <Image
                    source={{ uri: featuredImageUri }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                    accessible={true}
                    accessibilityLabel={`${featuredCard.productName} 상품 이미지`}
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.accent, colors.primary]}
                    style={[styles.featuredImage, styles.featuredImageGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.featuredPlaceholderEmoji}>🛒</Text>
                  </LinearGradient>
                )}
                <View style={styles.featuredOverlay} />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ 이웃이 인증한</Text>
                </View>
                {featuredCard.hasClosingDiscount && (
                  <View style={styles.featuredClosingBadge}>
                    <Text style={styles.featuredClosingBadgeText}>마감할인</Text>
                  </View>
                )}
              </View>
              <View style={styles.featuredFooter}>
                <View style={styles.featuredFooterLeft}>
                  <Text style={styles.featuredStoreName} numberOfLines={1}>
                    {featuredCard.cheapestStore?.name || '매장 정보 없음'}
                  </Text>
                  <Text style={styles.featuredProductName} numberOfLines={1}>{featuredCard.productName}</Text>
                </View>
                <View style={styles.featuredPriceWrap}>
                  <Text style={styles.featuredPrice}>{formatPrice(featuredCard.minPrice)}</Text>
                  <Text style={styles.featuredDistance}>{featuredDist}</Text>
                </View>
              </View>
            </Pressable>
          </>
        )}

        {/* 오늘의 전단지 */}
        {flyersData && flyersData.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>오늘의 전단지</Text>
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('Flyer', { screen: 'FlyerList' })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="전단지 전체보기"
              >
                <Text style={styles.sectionMoreText}>전체보기 →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flyerStrip}
            >
              {flyersData.slice(0, 5).map((flyer, index) => (
                <TouchableOpacity
                  key={flyer.id}
                  onPress={() => navigation.getParent()?.navigate('Flyer', { screen: 'FlyerList' })}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${flyer.storeName} 전단지 보기`}
                >
                  <LinearGradient
                    colors={FLYER_GRAD_COLORS[index % FLYER_GRAD_COLORS.length]}
                    style={styles.flyerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.flyerCircle1} />
                    <View style={styles.flyerCircle2} />
                    <Text style={styles.flyerEmoji}>{flyer.emoji}</Text>
                    <Text style={styles.flyerTitle}>{flyer.storeName}</Text>
                    <Text style={styles.flyerSubtitle}>{flyer.promotionTitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* 근처 가격 정보 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>근처 가격 정보</Text>
          <View style={styles.sectionLiveWrap}>
            <Text style={styles.sectionLiveDot}>⚡</Text>
            <Text style={styles.sectionLiveText}>실시간 업데이트</Text>
          </View>
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
    userLat,
    userLng,
  ]);

  const listContentPaddingStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + spacing.tabBarContentHeight + spacing.xl }),
    [insets.bottom],
  );

  const renderGridCard = useCallback(
    ({ item }: ListRenderItemInfo<ProductPriceCard>) => {
      const imageUri = fixImageUrl(item.imageUrl);
      const dist =
        item.cheapestStore?.latitude != null &&
        item.cheapestStore?.longitude != null &&
        userLat != null &&
        userLng != null
          ? formatDistance(
              getDistanceM(userLat, userLng, item.cheapestStore.latitude, item.cheapestStore.longitude),
            )
          : '-';
      return (
        <Pressable
          style={({ pressed }) => [styles.gridCard, pressed && styles.gridCardPressed]}
          onPress={() => handleCardPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} ${formatPrice(item.minPrice)}`}
        >
          <View style={styles.gridImageWrap}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.gridImage}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={`${item.productName} 상품 이미지`}
              />
            ) : (
              <View style={styles.gridImagePlaceholder}>
                <TagIcon size={26} color={colors.gray400} />
              </View>
            )}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => addWishlist(item.productId)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${item.productName} 찜하기`}
            >
              <HeartIcon size={14} color={colors.white} />
            </TouchableOpacity>
            {dist !== '-' && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>{dist}</Text>
              </View>
            )}
            {item.storeCount > 1 && (
              <View style={styles.storeCountBadge}>
                <Text style={styles.storeCountBadgeText}>매장 {item.storeCount}곳</Text>
              </View>
            )}
          </View>
          <View style={styles.gridInfo}>
            {item.hasClosingDiscount && (
              <View style={styles.closingBadge}>
                <Text style={styles.closingBadgeText}>마감</Text>
              </View>
            )}
            <Text style={styles.gridProductName} numberOfLines={2}>{item.productName}</Text>
            <Text style={styles.gridPrice}>{formatPrice(item.minPrice)}</Text>
            <View style={styles.gridStoreRow}>
              <StoreIcon size={11} color={colors.gray400} />
              <Text style={styles.gridStoreName} numberOfLines={1}>
                {item.cheapestStore?.name || '매장 정보 없음'}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleCardPress, addWishlist, userLat, userLng],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
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
          <Text style={styles.brandText}>NearPrice</Text>
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

      {/* 검색바 */}
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

      {/* 동네 미설정 배너 */}
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

      {/* 메인 콘텐츠 (2열 그리드) */}
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
    ...typography.headingLg,
    color: colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.olive,
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: spacing.radiusXl,
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
    backgroundColor: colors.accent,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },

  // ─── 동네 배너 ────────────────────────────────────────────────────────
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

  // ─── 리스트 ────────────────────────────────────────────────────────────
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
  },

  // ─── 인기 태그 ─────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tagChip: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
  tagTextActive: {
    color: colors.white,
    fontWeight: '700' as const,
  },

  // ─── 섹션 헤더 ─────────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  sectionMoreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  sectionLiveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLiveDot: {
    fontSize: 14,
  },
  sectionLiveText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.3,
  },

  // ─── 이웃 즐겨찾기 (Featured Card) ────────────────────────────────────
  featuredCard: {
    marginHorizontal: spacing.lg,
    borderRadius: spacing.radiusXl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  featuredImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImageGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPlaceholderEmoji: {
    fontSize: 48,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.featuredImageOverlay,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.olive,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },
  featuredClosingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  featuredClosingBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  featuredFooterLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  featuredStoreName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  featuredProductName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.black,
  },
  featuredPriceWrap: {
    alignItems: 'flex-end',
  },
  featuredPrice: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.primary,
  },
  featuredDistance: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.gray400,
    marginTop: spacing.xs,
  },

  // ─── 전단지 스트립 ─────────────────────────────────────────────────────
  flyerStrip: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  flyerCard: {
    width: 140,
    height: 100,
    borderRadius: spacing.radiusLg,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  flyerCircle1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.flyerCircleOverlay,
    top: -20,
    right: -20,
  },
  flyerCircle2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.flyerCircleOverlayFaint,
    bottom: 10,
    right: 30,
  },
  flyerEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  flyerTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: spacing.micro,
  },
  flyerSubtitle: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.flyerSubtitleText,
  },

  // ─── 2열 그리드 ────────────────────────────────────────────────────────
  gridRow: {
    gap: GRID_GAP,
    paddingHorizontal: GRID_PADDING,
    marginBottom: spacing.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.99 }],
  },
  gridImageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.secondaryBg,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.heartBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.distanceBadgeBg,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.white,
  },
  storeCountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  storeCountBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.white,
  },
  gridInfo: {
    padding: spacing.md,
  },
  closingBadge: {
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  closingBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.danger,
  },
  gridProductName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.black,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  gridStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridStoreName: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.gray600,
    flex: 1,
  },
});

export default HomeScreen;
