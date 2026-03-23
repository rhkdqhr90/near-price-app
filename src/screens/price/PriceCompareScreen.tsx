import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  LayoutAnimation,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useProductPricesByName } from '../../hooks/queries/usePrices';
import { useMyWishlist, useAddWishlist, useRemoveWishlist } from '../../hooks/queries/useWishlist';
import { useLocationStore, RADIUS_OPTIONS, type RadiusOption } from '../../store/locationStore';
import { getDistanceM, formatPrice } from '../../utils/format';
import PriceRankCard from '../../components/price/PriceRankCard';
import PriceMapView from '../../components/price/PriceMapView';
import PriceTrendChart from '../../components/price/PriceTrendChart';
import EmptyState from '../../components/common/EmptyState';
import SkeletonCard from '../../components/common/SkeletonCard';
import HeartIcon from '../../components/icons/HeartIcon';
import TagIcon from '../../components/icons/TagIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import type { PriceResponse } from '../../types/api.types';
import { useToastStore } from '../../store/toastStore';

const RADIUS_LABELS: Record<RadiusOption, string> = {
  1000: '1km 이내',
  3000: '3km 이내',
  5000: '5km 이내',
  10000: '10km 이내',
};

type Props = HomeScreenProps<'PriceCompare'>;
type ViewMode = 'list' | 'map';

const PriceCompareScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showRadiusDropdown, setShowRadiusDropdown] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const { latitude, longitude, radius, setRadius } = useLocationStore();

  const {
    data: prices,
    isLoading: isPricesLoading,
    isError: isPricesError,
    refetch: refetchPrices,
  } = useProductPricesByName(productName);

  const filteredPrices = useMemo(() => {
    if (!prices) return [];
    if (latitude === null || longitude === null) return prices;
    return prices.filter((p) => {
      if (!p.store) return true;
      if (p.store.latitude == null || p.store.longitude == null) return true;
      if (isNaN(p.store.latitude) || isNaN(p.store.longitude)) return true;
      const dist = getDistanceM(latitude, longitude, p.store.latitude, p.store.longitude);
      return !isNaN(dist) && dist <= radius;
    });
  }, [prices, latitude, longitude, radius]);

  // 가격 통계
  const priceStats = useMemo(() => {
    if (!filteredPrices || filteredPrices.length === 0) return null;
    const sorted = [...filteredPrices].sort((a, b) => a.price - b.price);
    const min = sorted[0].price;
    const max = sorted[sorted.length - 1].price;
    const avg = Math.round(filteredPrices.reduce((s, p) => s + p.price, 0) / filteredPrices.length);
    return { min, max, avg, count: filteredPrices.length, cheapestStore: sorted[0].store?.name ?? '알 수 없음' };
  }, [filteredPrices]);

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
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);
    const opts = {
      onSuccess: () => { showToast(isWishlisted ? '찜 해제' : '찜 완료', 'success'); setIsWishlistLoading(false); },
      onError: () => { showToast('오류가 발생했어요', 'error'); setIsWishlistLoading(false); },
    };
    if (isWishlisted) { removeWishlist(productId, opts); }
    else { addWishlist(productId, opts); }
  }, [isWishlisted, isWishlistLoading, addWishlist, removeWishlist, productId, showToast]);

  const handlePriceCardPress = useCallback(
    (price: PriceResponse) => {
      navigation.navigate('PriceDetail', { priceId: price.id });
    },
    [navigation],
  );

  const handleStorePress = useCallback(
    (storeId: string) => { navigation.navigate('StoreDetail', { storeId }); },
    [navigation],
  );

  const handleRadiusSelect = useCallback((opt: RadiusOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(150, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setRadius(opt);
    setShowRadiusDropdown(false);
  }, [setRadius]);

  const renderPriceItem = useCallback(
    ({ item, index }: { item: PriceResponse; index: number }) => (
      <PriceRankCard rank={index + 1} price={item} onPress={handlePriceCardPress} />
    ),
    [handlePriceCardPress],
  );

  // ─── 가격 요약 카드 ──────────────────────────────────────────────────────
  const renderSummaryHeader = useCallback(() => {
    if (!priceStats) return null;
    return (
      <View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>최저가</Text>
              <Text style={styles.summaryValuePrimary}>{formatPrice(priceStats.min)}</Text>
              <Text style={styles.summaryStoreName}>{priceStats.cheapestStore}</Text>
            </View>
            {priceStats.count > 1 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>평균가</Text>
                  <Text style={styles.summaryValue}>{formatPrice(priceStats.avg)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>최고가</Text>
                  <Text style={styles.summaryValueMuted}>{formatPrice(priceStats.max)}</Text>
                </View>
              </>
            )}
          </View>
        </View>
        <PriceTrendChart prices={filteredPrices} />
      </View>
    );
  }, [priceStats, filteredPrices]);

  const renderContent = useCallback(() => {
    if (isPricesLoading) return <SkeletonCard variant="rank" />;
    if (isPricesError) {
      return (
        <EmptyState icon={WifiOffIcon} title="불러올 수 없어요"
          subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
          action={{ label: '다시 시도', onPress: refetchPrices }} />
      );
    }
    if (filteredPrices.length === 0) {
      return (
        <EmptyState icon={TagIcon} title="등록된 가격이 없어요"
          subtitle={prices && prices.length > 0
            ? `${RADIUS_LABELS[radius]} 내에 등록된 가격 정보가 없습니다`
            : '아직 이 상품의 가격을 등록한 사람이 없어요'} />
      );
    }

    if (viewMode === 'list') {
      return (
        <FlatList
          data={filteredPrices}
          keyExtractor={item => item.id}
          renderItem={renderPriceItem}
          ListHeaderComponent={renderSummaryHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh}
              tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      );
    }
    return <PriceMapView prices={filteredPrices} onMarkerPress={handleStorePress} />;
  }, [isPricesLoading, isPricesError, filteredPrices, prices, viewMode, radius,
    isRefreshing, handleRefresh, renderPriceItem, refetchPrices, handleStorePress, renderSummaryHeader]);

  return (
    <View style={styles.container}>
      {/* ─── 헤더 ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {/* 뒤로가기 + 상품명 */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
            accessibilityRole="button" accessibilityLabel="뒤로 가기">
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
            {prices && prices.length > 0 && (
              <Text style={styles.priceCount}>{filteredPrices.length}건</Text>
            )}
          </View>
          {/* 찜 버튼 */}
          <TouchableOpacity
            style={[styles.wishBtn, isWishlisted && styles.wishBtnActive]}
            onPress={handleWishlistToggle}
            disabled={isWishlistLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isWishlisted ? '찜 해제' : '찜하기'}
          >
            {isWishlistLoading ? (
              <ActivityIndicator size="small" color={isWishlisted ? colors.white : colors.primary} />
            ) : (
              <HeartIcon size={18} color={isWishlisted ? colors.white : colors.gray400} filled={isWishlisted} />
            )}
          </TouchableOpacity>
        </View>

        {/* 컨트롤 바: 목록/지도 토글 + 거리 드롭다운 */}
        <View style={styles.controlBar}>
          {/* 목록/지도 토글 */}
          <View style={styles.viewToggle}>
            {(['list', 'map'] as ViewMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.viewToggleBtn, viewMode === mode && styles.viewToggleBtnActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
                  setViewMode(mode);
                }}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: viewMode === mode }}
              >
                <Text style={[styles.viewToggleText, viewMode === mode && styles.viewToggleTextActive]}>
                  {mode === 'list' ? '목록' : '지도'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 거리 드롭다운 */}
          <TouchableOpacity
            style={styles.radiusDropdown}
            onPress={() => setShowRadiusDropdown(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`거리 필터: ${RADIUS_LABELS[radius]}`}
          >
            <Text style={styles.radiusDropdownText}>{RADIUS_LABELS[radius]}</Text>
            <ChevronDownIcon size={14} color={colors.gray600} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 콘텐츠 ──────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* ─── 거리 드롭다운 모달 ────────────────────────────────────────── */}
      <Modal
        visible={showRadiusDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRadiusDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowRadiusDropdown(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>거리 범위</Text>
            {RADIUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, radius === opt && styles.dropdownItemActive]}
                onPress={() => handleRadiusSelect(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, radius === opt && styles.dropdownItemTextActive]}>
                  {RADIUS_LABELS[opt]}
                </Text>
                {radius === opt && <Text style={styles.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBg,
  },

  // ─── 헤더 ────────────────────────────────────────────────────────────
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  backBtnText: {
    ...typography.headingXl,
    color: colors.black,
  },
  headerTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  productName: {
    ...typography.headingXl,
  },
  priceCount: {
    ...typography.bodySm,
    color: colors.gray400,
  },
  wishBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  wishBtnActive: {
    backgroundColor: colors.primary,
  },

  // ─── 컨트롤 바 ──────────────────────────────────────────────────────
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: spacing.sm,
    padding: spacing.micro,
  },
  viewToggleBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.xs,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleText: {
    ...typography.bodySm,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  viewToggleTextActive: {
    color: colors.black,
    fontWeight: '600' as const,
  },

  // ─── 거리 드롭다운 버튼 ───────────────────────────────────────────────
  radiusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusFull,
  },
  radiusDropdownText: {
    ...typography.bodySm,
    fontWeight: '500' as const,
    color: colors.gray700,
  },

  // ─── 드롭다운 모달 ───────────────────────────────────────────────────
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    width: 240,
    paddingVertical: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownTitle: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.gray400,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.black,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  dropdownCheck: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700' as const,
  },

  // ─── 가격 요약 카드 ──────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.gray400,
    marginBottom: spacing.xs,
  },
  summaryValuePrimary: {
    ...typography.activityCount,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: spacing.xl,
    fontWeight: '600' as const,
    color: colors.black,
  },
  summaryValueMuted: {
    fontSize: spacing.xl,
    fontWeight: '600' as const,
    color: colors.gray400,
  },
  summaryStoreName: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.micro,
  },

  // ─── 콘텐츠 ─────────────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});

export default PriceCompareScreen;
