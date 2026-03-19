import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
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
import PriceCardSkeleton from '../../components/common/PriceCardSkeleton';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import BellIcon from '../../components/icons/BellIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import CameraIcon from '../../components/icons/CameraIcon';
import type { PriceResponse } from '../../types/api.types';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import { POPULAR_TAGS, AD_BANNER_PLACEHOLDER } from '../../utils/constants';

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
  confirmCount: number;
}

const groupPricesByProduct = (prices: PriceResponse[]): PriceCardData[] => {
  const map = new Map<string, PriceResponse[]>();
  prices.forEach((p) => {
    const group = map.get(p.product.id) ?? [];
    group.push(p);
    map.set(p.product.id, group);
  });

  return Array.from(map.values()).map((group) => {
    const sorted = [...group].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const pricelist = sorted.map((p) => p.price);
    return {
      productId: cheapest.product.id,
      productName: cheapest.product.name,
      unitType: cheapest.product.unitType,
      storeName: cheapest.store.name,
      distance: '-', // TODO: 위치 기반 실제 거리 계산 필요
      time: formatRelativeTime(cheapest.createdAt),
      minPrice: Math.min(...pricelist),
      maxPrice: Math.max(...pricelist),
      storeCount: group.length,
      hasClosingDiscount: group.some(
        (p) => p.condition != null && p.condition.includes('마감'),
      ),
      confirmCount: group.reduce((sum, p) => sum + p.likeCount, 0),
    };
  });
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const regionName = useLocationStore((s) => s.regionName) ?? '내 동네';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fabScale = useRef(new Animated.Value(1)).current;

  const {
    data: recentPrices,
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
  } = useRecentPrices();

  const priceCards = useMemo(
    () => groupPricesByProduct(recentPrices ?? []),
    [recentPrices],
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

  const handleFabPress = useCallback(() => {
    navigation.navigate('PriceRegisterStack', {
      screen: 'StoreSelect',
    });
  }, [navigation]);

  const onFabPressIn = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  }, [fabScale]);

  const onFabPressOut = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  }, [fabScale]);

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
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 광고 배너 */}
        <View style={styles.adBanner}>
          <View style={styles.adStoreIcon}>
            <Text style={styles.adStoreEmoji}>🏪</Text>
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
        {isRecentLoading && <PriceCardSkeleton />}
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
      { paddingBottom: insets.bottom + spacing.tabBarContentHeight + spacing.fabBottom + spacing.fabSize + spacing.sm },
    ],
    [insets.bottom],
  );

  const fabBottomStyle = useMemo(
    () => ({ bottom: insets.bottom + spacing.tabBarContentHeight + spacing.fabBottom }),
    [insets.bottom],
  );

  // ─── 가격 카드 ─────────────────────────────────────────────────────────
  const renderPriceCard = useCallback(
    ({ item }: ListRenderItemInfo<PriceCardData>) => (
      <Pressable
        style={({ pressed }) => [styles.priceCard, pressed && styles.priceCardPressed]}
        onPress={() => handleCardPress(item)}
        android_ripple={{ color: colors.gray200 }}
      >
        <View style={styles.cardColorBar} />
        <View style={styles.cardBody}>
          <View style={styles.cardLeft}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardProductName} numberOfLines={1}>
                {item.productName}
                <Text style={styles.cardUnitType}> {item.unitType}</Text>
              </Text>
              {item.hasClosingDiscount && (
                <View style={styles.closingBadge}>
                  <Text style={styles.closingBadgeText}>마감할인</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.storeName}
              <Text style={styles.cardMetaDot}> · </Text>
              {item.distance}
              <Text style={styles.cardMetaDot}> · </Text>
              {item.time}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardMinPrice}>{formatPrice(item.minPrice)}</Text>
            {item.storeCount > 1 && (
              <Text style={styles.cardMaxPrice}>{formatPrice(item.maxPrice)}</Text>
            )}
            <Text style={styles.cardCompare}>{item.storeCount}곳 비교</Text>
            {item.confirmCount > 0 && (
              <Text style={styles.cardConfirm}>✓ {item.confirmCount}</Text>
            )}
          </View>
        </View>
      </Pressable>
    ),
    [handleCardPress],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── 헤더 ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* TODO: 동네 변경 기능 구현 시 TouchableOpacity로 교체 */}
        <View style={styles.regionButton}>
          <Text style={styles.regionText}>{regionName}</Text>
          <ChevronDownIcon size={14} color={colors.black} />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
          >
            <SearchIcon size={22} color={colors.black} />
          </TouchableOpacity>
          {/* TODO: 알림 기능 구현 시 TouchableOpacity로 교체 */}
          <View style={styles.headerIconBtn}>
            <View>
              <BellIcon size={22} color={colors.black} />
              <View style={styles.notifDot} />
            </View>
          </View>
        </View>
      </View>

      {/* ─── 검색바 ──────────────────────────────────────────────────── */}
      <View style={styles.searchBarWrap}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
          activeOpacity={0.7}
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

      {/* ─── FAB ─────────────────────────────────────────────────────── */}
      {/* fabShadow: shadow wrapper (overflow visible 필요) */}
      {/* fab: overflow:hidden wrapper for ripple clip */}
      <Animated.View
        style={[
          styles.fabShadow,
          fabBottomStyle,
          { transform: [{ scale: fabScale }] },
        ]}
      >
        <View style={styles.fab}>
          <Pressable
            onPress={handleFabPress}
            onPressIn={onFabPressIn}
            onPressOut={onFabPressOut}
            style={styles.fabPressable}
            android_ripple={{ color: colors.fabRipple, borderless: false }}
          >
            <CameraIcon size={26} color={colors.white} />
          </Pressable>
        </View>
      </Animated.View>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    borderRadius: 10,
    paddingHorizontal: 14, // no exact spacing token (between md:12 and lg:16)
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
    paddingTop: spacing.headerContent,
    paddingHorizontal: spacing.xl,
    gap: spacing.sectionGap,
  },

  // ─── 인기 태그 ─────────────────────────────────────────────────────────
  section: {},
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  tagChip: {
    backgroundColor: colors.gray100,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tagText: {
    ...typography.tagText,
  },

  // ─── 광고 배너 ─────────────────────────────────────────────────────────
  adBanner: {
    backgroundColor: colors.adBg,
    borderRadius: spacing.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  adStoreIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adStoreEmoji: {
    fontSize: 22,
  },
  adContent: {
    flex: 1,
  },
  adStoreName: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.gray900,
    marginBottom: 2,
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
    ...typography.headingLg,
    marginBottom: -spacing.cardGap,
  },

  // ─── 가격 카드 ─────────────────────────────────────────────────────────
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
  },
  priceCardPressed: {
    opacity: 0.7,
  },
  cardColorBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginVertical: spacing.md,
    marginLeft: 14, // no exact token
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // no exact token (between xs:4 and sm:8)
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  cardProductName: {
    ...typography.headingMd,
  },
  cardUnitType: {
    ...typography.tagText,
    fontWeight: '400' as const,
    color: colors.gray600,
  },
  cardMeta: {
    ...typography.bodySm,
  },
  cardMetaDot: {
    color: colors.cardDivider,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardMinPrice: {
    ...typography.price,
  },
  cardMaxPrice: {
    ...typography.caption,
    color: colors.gray400,
  },
  cardCompare: {
    ...typography.captionBold,
    color: colors.primary,
  },
  cardConfirm: {
    ...typography.caption,
    color: colors.primary,
  },

  // ─── 마감할인 뱃지 ──────────────────────────────────────────────────────
  closingBadge: {
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.xs,
    paddingHorizontal: 6, // no exact token
    paddingVertical: 2,   // no exact token
  },
  closingBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.danger,
  },

  // ─── FAB ───────────────────────────────────────────────────────────────
  fabShadow: {
    position: 'absolute',
    right: spacing.fabRight,
    width: spacing.fabSize,
    height: spacing.fabSize,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fab: {
    flex: 1,
    borderRadius: 16,
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
