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
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import HeartIcon from '../../components/icons/HeartIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
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

  if (isLoading) return <SkeletonCard variant="wishlist" />;
  if (isError) {
    return (
      <EmptyState
        icon={WifiOffIcon}
        title="불러올 수 없어요"
        subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
        action={{ label: '다시 시도', onPress: refetch }}
      />
    );
  }

  const items = wishlist?.items ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>찜 목록</Text>
        <Text style={styles.headerCount}>{items.length}개</Text>
      </View>
      {items.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="찜한 상품이 없어요"
          subtitle={'관심 상품을 찜하면\n최저가를 한눈에 확인할 수 있어요'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.productId}
          renderItem={renderItem}
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
  headerTitle: { ...typography.headingXl },
  headerCount: { ...typography.bodySm },
  listContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl + spacing.lg },
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
