import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../../navigation/types';
import type { SearchProductResult, NearbyStoreResponse } from '../../types/api.types';
import { useSearchProductsES } from '../../hooks/queries/useProducts';
import { useNearbyStores } from '../../hooks/queries/useNearbyStores';
import { useLocationStore } from '../../store/locationStore';
import EmptyState from '../../components/common/EmptyState';
import HighlightText from '../../components/common/HighlightText';
import SearchIcon from '../../components/icons/SearchIcon';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import TagIcon from '../../components/icons/TagIcon';
import StoreIcon from '../../components/icons/StoreIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

type Props = HomeScreenProps<'Search'>;

type TabType = 'product' | 'store';

const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const { latitude, longitude } = useLocationStore();
  const [activeTab, setActiveTab] = useState<TabType>('product');
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedQuery(text), 300);
  }, []);

  const handleClear = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  const { data: productResults, isLoading: isProductLoading, isError: isProductError, refetch: refetchProducts } =
    useSearchProductsES(activeTab === 'product' ? debouncedQuery : '');

  const { data: storeResults, isLoading: isStoreLoading, isError: isStoreError, refetch: refetchStores } =
    useNearbyStores(
      activeTab === 'store' ? latitude : null,
      activeTab === 'store' ? longitude : null,
    );

  const filteredStoreResults = useMemo(() => {
    if (!storeResults) return undefined;
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return storeResults;
    return storeResults.filter(s => s.name.toLowerCase().includes(q));
  }, [storeResults, debouncedQuery]);

  const handleProductPress = useCallback(
    (item: SearchProductResult) => {
      navigation.navigate('PriceCompare', {
        productId: item.id,
        productName: item.name,
      });
    },
    [navigation],
  );

  const handleStorePress = useCallback(
    (store: NearbyStoreResponse) => {
      navigation.navigate('StoreDetail', { storeId: store.id });
    },
    [navigation],
  );

  const renderProductItem = useCallback(
    ({ item }: ListRenderItemInfo<SearchProductResult>) => {
      const highlightText = item.highlight[0] ?? item.name;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.7}
        >
          <SearchIcon size={16} color={colors.gray400} />
          <View style={styles.resultBody}>
            <HighlightText text={highlightText} baseStyle={styles.resultName} />
          </View>
        </TouchableOpacity>
      );
    },
    [handleProductPress],
  );

  const renderStoreItem = useCallback(
    ({ item }: ListRenderItemInfo<NearbyStoreResponse>) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleStorePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.storeIconBox}>
          <StoreIcon size={16} color={colors.gray600} />
        </View>
        <View style={styles.resultBody}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultSub} numberOfLines={1}>{item.address}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance}m</Text>
      </TouchableOpacity>
    ),
    [handleStorePress],
  );

  const noLocation = activeTab === 'store' && (latitude == null || longitude == null);
  const isLoading = activeTab === 'product' ? isProductLoading : isStoreLoading;
  const isError = activeTab === 'product' ? isProductError : isStoreError;
  const onRetry = activeTab === 'product' ? refetchProducts : refetchStores;
  const isEmpty = activeTab === 'product'
    ? (!productResults || productResults.length === 0)
    : (!filteredStoreResults || filteredStoreResults.length === 0);
  const showEmpty = !isLoading && !isError && debouncedQuery.trim().length > 0 && isEmpty;
  const showIdle = activeTab === 'product' && debouncedQuery.trim().length === 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.inner}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.gray400} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={activeTab === 'product' ? '상품 이름 검색' : '매장명 검색 (예: 이마트)'}
            placeholderTextColor={colors.gray400}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={HIT_SLOP}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        {(['product', 'store'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'product' ? '상품' : '매장'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 콘텐츠 */}
      {noLocation ? (
        <EmptyState
          icon={WifiOffIcon}
          title="위치가 설정되지 않았어요"
          subtitle="홈 화면에서 동네를 설정한 후 매장을 검색해 주세요."
        />
      ) : showIdle ? (
        <EmptyState
          icon={SearchIcon}
          iconSize={48}
          title="상품 이름을 입력하세요"
        />
      ) : isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon={WifiOffIcon}
          title="검색에 실패했어요"
          subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
          action={{ label: '다시 시도', onPress: onRetry }}
        />
      ) : showEmpty ? (
        <EmptyState
          icon={TagIcon}
          title="검색 결과가 없어요"
          subtitle="다른 키워드로 검색해 보세요"
        />
      ) : activeTab === 'product' ? (
        <FlatList
          data={productResults ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          data={filteredStoreResults ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderStoreItem}
          keyboardShouldPersistTaps="handled"
        />
      )}
      </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  clearText: {
    ...typography.body,
    color: colors.gray400,
    paddingHorizontal: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.headingMd,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.tagText,
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  storeIconBox: {
    width: 32,
    height: 32,
    borderRadius: spacing.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: {
    flex: 1,
  },
  resultName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  resultSub: {
    ...typography.bodySm,
  },
  distanceText: {
    ...typography.bodySm,
    color: colors.gray400,
  },
});

export default SearchScreen;
