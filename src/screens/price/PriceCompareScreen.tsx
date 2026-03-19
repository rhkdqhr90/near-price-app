import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useProductPrices } from '../../hooks/queries/usePrices';
import { useMyWishlist, useAddWishlist, useRemoveWishlist } from '../../hooks/queries/useWishlist';
import { useLocationStore, RADIUS_OPTIONS, type RadiusOption } from '../../store/locationStore';
import { getDistanceM } from '../../utils/format';
import PriceRankCard from '../../components/price/PriceRankCard';
import ReactionButtons from '../../components/price/ReactionButtons';
import PriceMapView from '../../components/price/PriceMapView';
import EmptyState from '../../components/common/EmptyState';
import PriceRankCardSkeleton from '../../components/common/PriceRankCardSkeleton';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import type { PriceResponse } from '../../types/api.types';
import { useToastStore } from '../../store/toastStore';

const RADIUS_LABELS: Record<RadiusOption, string> = {
  3000: '3km',
  5000: '5km',
  10000: '10km',
  15000: '15km',
};

type Props = HomeScreenProps<'PriceCompare'>;
type ViewMode = 'list' | 'map';

const PriceCompareScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const { latitude, longitude, radius, setRadius } = useLocationStore();

  const {
    data: prices,
    isLoading: isPricesLoading,
    isError: isPricesError,
    refetch: refetchPrices,
  } = useProductPrices(productId);

  const filteredPrices = useMemo(() => {
    if (!prices || latitude === null || longitude === null) return prices ?? [];
    return prices.filter((p) => {
      const dist = getDistanceM(latitude, longitude, p.store.latitude, p.store.longitude);
      return dist <= radius;
    });
  }, [prices, latitude, longitude, radius]);

  const { data: wishlist } = useMyWishlist();
  const { mutate: addWishlist } = useAddWishlist();
  const { mutate: removeWishlist } = useRemoveWishlist();

  const isWishlisted = wishlist?.items?.some(item => item.productId === productId) ?? false;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchPrices();
    setIsRefreshing(false);
  }, [refetchPrices]);

  const handleWishlistToggle = useCallback(() => {
    if (isWishlisted) {
      removeWishlist(productId, {
        onSuccess: () => showToast('찜 목록에서 제거했어요', 'info'),
        onError: () => showToast('오류가 발생했어요', 'error'),
      });
    } else {
      addWishlist(productId, {
        onSuccess: () => showToast('찜 목록에 추가했어요', 'success'),
        onError: () => showToast('오류가 발생했어요', 'error'),
      });
    }
  }, [isWishlisted, addWishlist, removeWishlist, productId, showToast]);

  const handleStorePress = useCallback(
    (storeId: string) => {
      navigation.navigate('StoreDetail', { storeId });
    },
    [navigation],
  );

  const renderPriceItem = useCallback(
    ({ item, index }: { item: PriceResponse; index: number }) => (
      <View>
        <PriceRankCard
          rank={index + 1}
          price={item}
          onPress={handleStorePress}
        />
        <View style={styles.reactionRow}>
          <ReactionButtons priceId={item.id} />
        </View>
      </View>
    ),
    [handleStorePress],
  );

  const renderContent = useCallback(() => {
    if (isPricesLoading) {
      return <PriceRankCardSkeleton />;
    }
    if (isPricesError) {
      return (
        <EmptyState
          icon={WifiOffIcon}
          title="불러올 수 없어요"
          subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
          action={{ label: '다시 시도', onPress: refetchPrices }}
        />
      );
    }
    if (filteredPrices.length === 0) {
      return (
        <EmptyState
          icon={TagIcon}
          title="등록된 가격이 없어요"
          subtitle={
            prices && prices.length > 0
              ? `${RADIUS_LABELS[radius]} 내에 등록된 가격 정보가 없습니다`
              : '아직 이 상품의 가격을 등록한 사람이 없어요'
          }
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <FlatList
          data={filteredPrices}
          keyExtractor={item => item.id}
          renderItem={renderPriceItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      );
    }

    return (
      <PriceMapView
        prices={filteredPrices}
        onMarkerPress={handleStorePress}
      />
    );
  }, [
    isPricesLoading, isPricesError, filteredPrices, prices,
    viewMode, radius, isRefreshing, handleRefresh,
    renderPriceItem, refetchPrices, handleStorePress,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.productName}>{productName}</Text>
          <TouchableOpacity
            style={[styles.wishlistButton, isWishlisted ? styles.wishlistButtonActive : styles.wishlistButtonInactive]}
            onPress={handleWishlistToggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.wishlistButtonText, isWishlisted ? styles.wishlistButtonTextActive : styles.wishlistButtonTextInactive]}>
              {isWishlisted ? '♥ 찜됨' : '♡ 찜하기'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' ? styles.toggleButtonActive : styles.toggleButtonInactive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleButtonText, viewMode === 'list' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive]}>
                목록
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'map' ? styles.toggleButtonActive : styles.toggleButtonInactive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleButtonText, viewMode === 'map' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive]}>
                지도
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.radiusRow}
          >
            {RADIUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.radiusChip, radius === opt && styles.radiusChipActive]}
                onPress={() => setRadius(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.radiusChipText, radius === opt && styles.radiusChipTextActive]}>
                  {RADIUS_LABELS[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productName: {
    ...typography.headingXl,
    flex: 1,
  },
  wishlistButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  wishlistButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wishlistButtonInactive: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  wishlistButtonText: {
    ...typography.bodySm,
  },
  wishlistButtonTextActive: {
    color: colors.white,
    fontWeight: '500' as const,
  },
  wishlistButtonTextInactive: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  controlRow: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 2,
  },
  radiusRow: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  radiusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  radiusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radiusChipText: {
    ...typography.bodySm,
    fontWeight: '500' as const,
  },
  radiusChipTextActive: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonInactive: {},
  toggleButtonText: {
    ...typography.bodySm,
    fontWeight: '500' as const,
  },
  toggleButtonTextActive: {
    color: colors.black,
    fontWeight: '600' as const,
  },
  toggleButtonTextInactive: {
    color: colors.gray600,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  reactionRow: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
});

export default PriceCompareScreen;
