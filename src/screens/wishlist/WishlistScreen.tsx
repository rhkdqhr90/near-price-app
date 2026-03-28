import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Pressable,
  StyleSheet, Alert, RefreshControl, type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabScreenProps } from '../../navigation/types';
import type { WishlistItem, ProductCategory, UnitType } from '../../types/api.types';
import { useMyWishlist, useRemoveWishlist } from '../../hooks/queries/useWishlist';
import SkeletonCard from '../../components/common/SkeletonCard';
import HeartIcon from '../../components/icons/HeartIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import { formatPrice } from '../../utils/format';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MainTabScreenProps<'Wishlist'>;

// ── 단위 표시 ──────────────────────────────────────────────────────────────
const UNIT_LABEL: Record<UnitType, string> = {
  g: 'g', kg: 'kg', ml: 'ml', l: 'L',
  count: '개', bunch: '단', pack: '팩', bag: '봉', other: '',
};

// ── 카테고리 → 한글 배지 / 이모지 ─────────────────────────────────────────
const CATEGORY_BADGE: Record<ProductCategory, { label: string; emoji: string }> = {
  vegetable:  { label: '채소',     emoji: '🥦' },
  fruit:      { label: '과일',     emoji: '🍎' },
  meat:       { label: '육류',     emoji: '🥩' },
  seafood:    { label: '수산물',   emoji: '🐟' },
  dairy:      { label: '유제품',   emoji: '🥛' },
  grain:      { label: '곡물',     emoji: '🌾' },
  processed:  { label: '가공식품', emoji: '🛒' },
  household:  { label: '생활용품', emoji: '🧴' },
  other:      { label: '기타',     emoji: '📦' },
};

const WishlistScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: wishlist, isLoading, isError, refetch } = useMyWishlist();
  const { mutate: removeWishlist } = useRemoveWishlist();

  const items = wishlist?.items ?? [];

  const listContentStyle = useMemo(
    () => ({
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl + spacing.lg,
    }),
    [insets.bottom],
  );

  const handleItemPress = useCallback((item: WishlistItem) => {
    navigation.navigate('HomeStack', {
      screen: 'PriceCompare',
      params: { productId: item.productId, productName: item.productName },
    });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleDelete = useCallback((item: WishlistItem) => {
    Alert.alert('찜 삭제', `${item.productName}을(를) 찜 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => removeWishlist(item.productId),
      },
    ]);
  }, [removeWishlist]);

  // ── 카드 (모든 아이템 동일 레이아웃) ────────────────────────────────────
  const renderCard = useCallback((item: WishlistItem) => {
    const badge = CATEGORY_BADGE[item.category] ?? { label: '기타', emoji: '📦' };
    const unitLabel = UNIT_LABEL[item.unitType] ?? '';
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleItemPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`찜한 상품 ${item.productName}${item.lowestPrice !== null ? ` ${formatPrice(item.lowestPrice)}` : ''}`}
      >
        {/* 이미지 영역: 다크 배경 + 이모지 */}
        <View style={styles.cardImgWrap}>
          <Text style={styles.cardEmoji}>{badge.emoji}</Text>
        </View>

        {/* 하트 버튼: 카드 우상단 absolute */}
        <TouchableOpacity
          style={styles.cardHeartBtn}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} 찜 삭제`}
        >
          <HeartIcon size={16} color={colors.danger} filled />
        </TouchableOpacity>

        {/* 콘텐츠 영역 */}
        <View style={styles.cardBody}>
          {/* 배지 (독립 row, 좌측 정렬) */}
          <View style={styles.cardBadgeRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{badge.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* 상품명 (1줄) */}
          <Text style={styles.cardProductName} numberOfLines={1}>{item.productName}</Text>

          {/* 가격 + 단위 */}
          {item.lowestPrice !== null ? (
            <View style={styles.cardPriceRow}>
              <Text style={styles.cardPrice}>{formatPrice(item.lowestPrice)}</Text>
              {unitLabel ? <Text style={styles.cardPriceUnit}>/ {unitLabel}</Text> : null}
            </View>
          ) : (
            <Text style={styles.noPriceText}>가격 정보 없음</Text>
          )}

          {/* 매장 */}
          {item.lowestPriceStoreName ? (
            <View style={styles.cardStoreRow}>
              <StoreIcon size={12} color={colors.outlineColor} />
              <Text style={styles.cardStoreName} numberOfLines={1}>
                {item.lowestPriceStoreName}
              </Text>
            </View>
          ) : null}

          {/* 버튼 */}
          <TouchableOpacity
            style={styles.cardViewBtn}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${item.productName} 가격 보기`}
          >
            <Text style={styles.cardViewBtnText}>→ 가격 보기</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  }, [handleItemPress, handleDelete]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<WishlistItem>) => {
    return renderCard(item);
  }, [renderCard]);

  // ── 빈 상태 ──────────────────────────────────────────────────────────────
  const renderEmpty = useCallback(() => {
    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCard}>
            <WifiOffIcon size={64} color={colors.gray400} />
          </View>
          <Text style={styles.emptyTitle}>불러올 수 없어요</Text>
          <Text style={styles.emptySubtitle}>네트워크 상태를 확인하고 다시 시도해 주세요.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => refetch()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.emptyBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyDecorCircle} />
        <View style={styles.emptyIconCard}>
          <HeartIcon size={80} color={colors.primary} filled />
        </View>
        <Text style={styles.emptyTitle}>찜한 항목이 없어요</Text>
        <Text style={styles.emptySubtitle}>
          마음에 드는 상품을 찜해보세요!{'\n'}하트 아이콘을 누르면 여기 저장돼요.
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동하여 상품 둘러보기"
        >
          <Text style={styles.emptyBtnText}>지금 둘러보기</Text>
        </TouchableOpacity>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipLabel}>큐레이션 팁</Text>
            <Text style={styles.tipBody}>
              가격 카드의 하트 아이콘을 누르면 나중에 볼 수 있도록 저장됩니다.
            </Text>
          </View>
        </View>
      </View>
    );
  }, [isError, refetch, navigation]);

  // ── 에디토리얼 헤더: "내 수확물" 44px extrabold ─────────────────────────
  const listHeader = useMemo(() => (
    <View style={styles.editorialHeader}>
      <Text style={styles.editorialTitle}>내 수확물</Text>
      <Text style={styles.editorialSubtitle}>동네 이웃이 추천한 물건, 한눈에 모아봐요.</Text>
    </View>
  ), []);

  // ── 추천 섹션 (리스트 하단) ─────────────────────────────────────────────
  const listFooter = useMemo(() => items.length > 0 ? (
    <View style={styles.recommendSection}>
      <Text style={styles.recommendLabel}>추천 상품</Text>
      <View style={styles.recommendCard}>
        <Text style={styles.recommendBody}>더 많은 동네 특산물을 찾아보세요.</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
          accessibilityRole="button"
          accessibilityLabel="계절 특산물 탐색하기"
        >
          <Text style={styles.recommendLink}>계절 특산물 탐색 →</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null, [items.length, navigation]);

  const containerStyle = useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );

  return (
    <View style={containerStyle}>
      {/* ── 헤더: "찜 목록" + 숫자 배지 ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>찜 목록</Text>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <SkeletonCard variant="wishlist" />
      ) : isError ? (
        renderEmpty()
      ) : items.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={renderItem}
          contentContainerStyle={listContentStyle}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ─── 헤더 ─────────────────────────────────────────────────────────────────
  // HTML: flex items-center gap-2 px-5 py-3
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.surfaceContainer,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.white,
  },

  // ─── 에디토리얼 헤더 ──────────────────────────────────────────────────────
  // HTML: text-[44px] font-extrabold text-primary leading-tight tracking-[-1.5px]
  editorialHeader: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  editorialTitle: {
    fontSize: 44,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -1.5,
    lineHeight: 50,
    marginBottom: spacing.xs,
  },
  editorialSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.onSurfaceVariant,
  },

  // ─── 공통 ─────────────────────────────────────────────────────────────────
  cardPressed: {
    opacity: 0.93,
    transform: [{ scale: 0.99 }],
  },
  noPriceText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.gray400,
  },

  // ─── 카드 (모든 아이템 동일) ─────────────────────────────────────────────
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: spacing.radiusLg,
    marginBottom: spacing.md,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',  // borderRadius 클리핑 유지 (Android 필수)
  },
  // 이미지: 2.5:1 비율 다크 배경 + 이모지
  cardImgWrap: {
    width: '100%',
    aspectRatio: 2.5,
    backgroundColor: colors.wishlistImgBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 52,
  },
  // 하트 버튼: 카드 우상단 absolute
  cardHeartBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: spacing.heartBtnSm,
    height: spacing.heartBtnSm,
    borderRadius: spacing.heartBtnSm / 2,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  // 콘텐츠 영역 (padding 축소: 16→12)
  cardBody: {
    padding: spacing.md,
  },
  // 배지 row (독립, 좌측 정렬)
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardBadge: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: colors.onTertiaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  cardProductName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.black,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  cardPriceUnit: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.outlineColor,
  },
  cardStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,  // 16px → 8px
  },
  cardStoreName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.outlineColor,
    flex: 1,
  },
  cardViewBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.sm + spacing.micro,  // 12px → 10px
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardViewBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },

  // ─── 추천 섹션 ────────────────────────────────────────────────────────────
  recommendSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  recommendLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: colors.tertiary,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    marginBottom: spacing.md,
  },
  recommendCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusLg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  recommendBody: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.onSurfaceVariant,
    textAlign: 'center' as const,
  },
  recommendLink: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.tertiaryFixedDim,
    paddingBottom: spacing.micro,
  },

  // ─── 빈 상태 ──────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  emptyDecorCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryLight,
    opacity: 0.4,
    top: '15%',
  },
  emptyIconCard: {
    width: 120,
    height: 120,
    borderRadius: spacing.radiusXl,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowOpacity: 0.06,
    shadowRadius: spacing.sm,
    elevation: spacing.xs,
  },
  emptyTitle: {
    ...typography.headingXl,
    color: colors.gray900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: spacing.xl,
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  emptyBtnText: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.white,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusMd,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  tipEmoji: {
    fontSize: spacing.iconSm,
    lineHeight: 22,
  },
  tipTextWrap: { flex: 1 },
  tipLabel: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: spacing.micro,
  },
  tipBody: {
    ...typography.bodySm,
    color: colors.gray700,
    lineHeight: spacing.lg,
  },
});

export default WishlistScreen;
