import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import type { StoreResponse } from '../../types/api.types';
import type { NaverPlaceDocument } from '../../hooks/queries/useNaverPlaceSearch';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import StoreIcon from '../icons/StoreIcon';
import CloseIcon from '../icons/CloseIcon';

interface Props {
  naverPlaces: NaverPlaceDocument[];
  dbStores: StoreResponse[] | undefined;
  debouncedQuery: string;
  selectedPlaceId: string | null;
  isNaverSearching: boolean;
  isDbLoading: boolean;
  isNaverError: boolean;
  isSelectingPlace: boolean;
  bottomInset: number;
  onSelectPlace: (place: NaverPlaceDocument) => void;
  onSelectDbStore: (storeId: string, storeName: string) => void;
  onClose: () => void;
  onRetry: () => void;
  onRegisterNew: () => void;
}

const StoreSearchResultsSheet: React.FC<Props> = ({
  naverPlaces,
  dbStores,
  debouncedQuery,
  selectedPlaceId,
  isNaverSearching,
  isDbLoading,
  isNaverError,
  isSelectingPlace,
  bottomInset,
  onSelectPlace,
  onSelectDbStore,
  onClose,
  onRetry,
  onRegisterNew,
}) => {
  const renderStoreItem = useCallback(({ item }: ListRenderItemInfo<NaverPlaceDocument>) => (
    <TouchableOpacity
      style={[styles.storeItem, selectedPlaceId === item.id && styles.storeItemActive]}
      onPress={() => onSelectPlace(item)}
      disabled={isSelectingPlace}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`매장 ${item.name} ${item.roadAddress || item.address}`}>
      <View style={styles.storeIconBox}>
        <StoreIcon size={18} color={selectedPlaceId === item.id ? colors.primary : colors.gray600} />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.storeAddress} numberOfLines={1}>{item.roadAddress || item.address}</Text>
        {item.category ? (
          <Text style={styles.storeCategory} numberOfLines={1}>{item.category}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ), [selectedPlaceId, onSelectPlace, isSelectingPlace]);

  const renderListEmpty = useCallback(() => {
    if (debouncedQuery.length < 2) {
      return (
        <View style={styles.centeredPad}>
          <Text style={styles.emptyText}>매장명을 입력해 검색하세요</Text>
        </View>
      );
    }
    if (isNaverSearching || isDbLoading) {
      return (
        <View style={styles.centeredPad}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="검색 중" />
        </View>
      );
    }
    if (isNaverError) {
      return (
        <View style={styles.centeredPad}>
          <Text style={styles.emptyText}>검색에 실패했어요</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="다시 시도">
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centeredPad}>
        <Text style={styles.emptyText}>검색 결과가 없어요</Text>
      </View>
    );
  }, [debouncedQuery, isNaverSearching, isDbLoading, isNaverError, onRetry]);

  const listContentContainerStyle = useMemo(
    () =>
      naverPlaces.length === 0
        ? styles.listContentEmpty
        : { paddingBottom: bottomInset + spacing.xxl },
    [naverPlaces.length, bottomInset],
  );

  const renderListFooter = useCallback(() => (
    <TouchableOpacity
      style={styles.registerFooter}
      onPress={onRegisterNew}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="매장 직접 등록">
      <Text style={styles.registerFooterText}>찾는 매장이 없어요 → 직접 등록</Text>
    </TouchableOpacity>
  ), [onRegisterNew]);

  const dbStoreListHeader = useMemo(() => (
    dbStores && dbStores.length > 0 ? (
      <View>
        <Text style={styles.searchSectionTitle}>앱에 등록된 매장</Text>
        {dbStores.map(store => (
          <TouchableOpacity
            key={store.id}
            style={[styles.storeItem, styles.dbStoreItem]}
            onPress={() => onSelectDbStore(store.id, store.name)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`등록 매장 ${store.name}`}>
            <View style={[styles.storeIconBox, styles.dbStoreIconBox]}>
              <StoreIcon size={18} color={colors.primary} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
              <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={styles.searchSectionTitle}>네이버 지도 검색</Text>
      </View>
    ) : null
  ), [dbStores, onSelectDbStore]);

  return (
    <View style={styles.searchResultsContainer} pointerEvents="box-none">
      <View style={styles.searchResultsContent}>
        <View style={styles.searchResultsHeader}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="검색 닫기">
            <CloseIcon size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        <FlatList
          style={styles.flatList}
          data={naverPlaces}
          keyExtractor={(item: NaverPlaceDocument) => item.id}
          renderItem={renderStoreItem}
          ListHeaderComponent={dbStoreListHeader}
          ListEmptyComponent={renderListEmpty}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={listContentContainerStyle}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={true}
          bounces={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flatList: { flex: 1 },
  searchResultsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    zIndex: 30,
    elevation: 30,
  },
  searchResultsContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusLg,
    borderTopRightRadius: spacing.radiusLg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: spacing.shadowOffsetYUp },
    shadowOpacity: 0.15,
    shadowRadius: spacing.shadowRadiusXl,
    elevation: 8,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredPad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  retryText: {
    ...typography.tagText,
    color: colors.primary,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  storeItemActive: {
    backgroundColor: colors.primaryLight,
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  storeAddress: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  storeCategory: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.micro,
  },
  registerFooter: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  registerFooterText: {
    ...typography.tagText,
    color: colors.primary,
  },
  searchSectionTitle: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.gray600,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
  },
  dbStoreItem: {
    backgroundColor: colors.primaryLight,
  },
  dbStoreIconBox: {
    backgroundColor: colors.white,
  },
});

export default StoreSearchResultsSheet;
