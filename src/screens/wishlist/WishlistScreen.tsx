import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Pressable,
  StyleSheet, Alert, RefreshControl, type ListRenderItemInfo,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabScreenProps } from '../../navigation/types';
import type { WishlistItem } from '../../types/api.types';
import { useMyWishlist, useRemoveWishlist } from '../../hooks/queries/useWishlist';
import SkeletonCard from '../../components/common/SkeletonCard';
import HeartIcon from '../../components/icons/HeartIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import { formatPrice } from '../../utils/format';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MainTabScreenProps<'Wishlist'>;

const WishlistScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: wishlist, isLoading, isError, refetch } = useMyWishlist();
  const { mutate: removeWishlist } = useRemoveWishlist();
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const listContentStyle = React.useMemo(
    () => ({
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl + spacing.lg,
    }),
    [insets.bottom],
  );

  const handleItemPress = useCallback((item: WishlistItem) => {
    // HomeStack으로 크로스 탭 이동: 탭 스택 상태 보존은 React Navigation 기본 동작
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
      {
        text: '취소',
        style: 'cancel',
        onPress: () => {
          // 스와이프 아이템 닫기
          const ref = swipeableRefs.current.get(item.productId);
          if (ref) {
            ref.close();
          }
        },
      },
      {
        text: '삭제',
        style: 'destructive',
        // toast 콜백은 useRemoveWishlist 훅 레벨에서 처리 (언마운트 후에도 안전)
        onPress: () => removeWishlist(item.productId),
      },
    ]);
  }, [removeWishlist]);

  const renderDeleteAction = useCallback(
    (item: WishlistItem) => (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            // Swipeable 닫기 후 삭제 로직 수행
            const ref = swipeableRefs.current.get(item.productId);
            if (ref) {
              ref.close();
            }
            removeWishlist(item.productId);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} 즉시 삭제`}
        >
          <Text style={styles.deleteActionText}>삭제</Text>
        </TouchableOpacity>
      </View>
    ),
    [removeWishlist]
  );

  const renderItem = useCallback(({ item }: ListRenderItemInfo<WishlistItem>) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(item.productId, ref);
        } else {
          swipeableRefs.current.delete(item.productId);
        }
      }}
      renderRightActions={() => renderDeleteAction(item)}
      overshootRight={false}
      rightThreshold={50}
      friction={2}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleItemPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`찜한 상품 ${item.productName}${item.lowestPrice !== null ? ` ${formatPrice(item.lowestPrice)}` : ''}`}
      >
        <View style={styles.cardColorBar} />
        <View style={styles.cardBody}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          {item.lowestPrice !== null ? (
            <View style={styles.priceRow}>
              <Text style={styles.lowestPrice}>{formatPrice(item.lowestPrice)}</Text>
              {item.lowestPriceStoreName ? (
                <Text style={styles.storeName} numberOfLines={1}>{item.lowestPriceStoreName}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noPrice}>가격 정보 없음</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`${item.productName} 찜 삭제`}
        >
          <HeartIcon size={20} color={colors.danger} filled />
        </TouchableOpacity>
      </Pressable>
    </Swipeable>
  ), [handleItemPress, handleDelete, renderDeleteAction]);

  const items = wishlist?.items ?? [];

  // ─── 빈 상태 ────────────────────────────────────────────────────────────
  const renderEmptyState = useCallback(() => {
    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCard}>
            <WifiOffIcon size={64} color={colors.gray400} />
          </View>
          <Text style={styles.emptyTitle}>불러올 수 없어요</Text>
          <Text style={styles.emptySubtitle}>네트워크 상태를 확인하고 다시 시도해 주세요.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.emptyButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        {/* 장식 배경 */}
        <View style={styles.emptyDecorCircle} />
        <View style={styles.emptyIconCard}>
          <HeartIcon size={80} color={colors.primary} filled />
        </View>

        {/* 텍스트 */}
        <Text style={styles.emptyTitle}>찜한 항목이 없습니다.</Text>
        <Text style={styles.emptySubtitle}>
          마음에 드는 상품을 찜해보세요!{'\n'}좋아하는 상품을 여기서 확인하실 수 있습니다.
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동하여 상품 둘러보기"
        >
          <Text style={styles.emptyButtonText}>지금 둘러보기</Text>
        </TouchableOpacity>

        {/* 큐레이션 팁 카드 */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipLabel}>큐레이션 팁</Text>
            <Text style={styles.tipBody}>가격 카드의 하트 아이콘을 누르면 나중에 볼 수 있도록 저장됩니다.</Text>
          </View>
        </View>
      </View>
    );
  }, [isError, refetch, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPinIcon size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>찜 목록 ({items.length})</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonCard variant="wishlist" />
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.productId}
          renderItem={renderItem}
          contentContainerStyle={listContentStyle}
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
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.headingXl },
  // ─── 빈 상태 ───────────────────────────────────────────────────────────
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
    backgroundColor: colors.secondaryBg,
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
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  emptyButtonText: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.white,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondaryBg,
    borderRadius: spacing.radiusMd,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  tipIconWrap: {
    width: spacing.rankBadgeSize,
    height: spacing.rankBadgeSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: { fontSize: spacing.iconSm },
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
  // ──────────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: spacing.radiusMd,
    borderWidth: 0.5, borderColor: colors.gray200,
    overflow: 'hidden', marginBottom: spacing.cardGap,
  },
  cardColorBar: {
    width: 3, backgroundColor: colors.primary, alignSelf: 'stretch',
    marginVertical: spacing.md, marginLeft: spacing.inputPad, borderRadius: spacing.micro,
  },
  cardBody: { flex: 1, paddingVertical: spacing.lg, paddingLeft: spacing.md, paddingRight: spacing.sm },
  cardPressed: { opacity: 0.7 },
  productName: { ...typography.headingMd, marginBottom: spacing.cardTextGap },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lowestPrice: { ...typography.price },
  storeName: { ...typography.bodySm, flex: 1 },
  noPrice: { ...typography.bodySm, color: colors.gray400 },
  deleteBtn: { padding: spacing.lg },
  deleteActionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: colors.danger,
    marginBottom: spacing.cardGap,
    borderRadius: spacing.radiusMd,
    marginRight: spacing.xl,
  },
  deleteAction: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.white,
  },
});

export default WishlistScreen;
