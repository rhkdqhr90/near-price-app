import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FlyerScreenProps, MainTabParamList } from '../../navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFlyerDetail } from '../../hooks/queries/useFlyers';
import SkeletonCard from '../../components/common/SkeletonCard';
import ErrorView from '../../components/common/ErrorView';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ShareIcon from '../../components/icons/ShareIcon';
import { naverLocalApi } from '../../api/naver-local.api';
import { openMapApp } from '../../utils/openMapApp';
import ColorFlyerTemplate from '../../components/flyer/ColorFlyerTemplate';
import NewsFlyerTemplate from '../../components/flyer/NewsFlyerTemplate';
import RisoFlyerTemplate from '../../components/flyer/RisoFlyerTemplate';
import PosterFlyerTemplate from '../../components/flyer/PosterFlyerTemplate';
import type { FlyerProductItem, FlyerTemplateType } from '../../types/api.types';
import { flyerApi } from '../../api/flyer.api';

type Props = FlyerScreenProps<'FlyerDetail'>;

const PAGE_SIZE = 8;

type FlyerStyle = 'color' | 'news' | 'riso' | 'poster';

const toFlyerStyle = (templateType: FlyerTemplateType | null | undefined): FlyerStyle => {
  if (templateType === 'news') return 'news';
  if (templateType === 'retro') return 'riso';
  if (templateType === 'coupon') return 'poster';
  return 'color';
};

const FlyerDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { flyerId } = route.params;
  const { data: flyer, isLoading, isError, refetch } = useFlyerDetail(flyerId);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [flyerId]);

  const handleShare = useCallback(async () => {
    if (!flyer) { return; }
    try {
      await Share.share({
        message: `[${flyer.storeName}] ${flyer.promotionTitle} ${flyer.dateRange}\n\nNearPrice 앱에서 확인하세요!`,
        title: `${flyer.storeName} 전단지`,
      });
    } catch {
      Alert.alert('공유 실패', '공유 기능을 사용할 수 없습니다.');
    }
  }, [flyer]);

  const handleDirection = useCallback(async () => {
    if (!flyer?.storeAddress) { return; }
    try {
      const candidates = await naverLocalApi.searchAddress(flyer.storeAddress);
      const first = candidates[0];
      if (first) {
        const latitude = parseFloat(first.y);
        const longitude = parseFloat(first.x);
        if (!isNaN(latitude) && !isNaN(longitude)) {
          await openMapApp(latitude, longitude, flyer.storeName);
          return;
        }
      }
    } catch {
      // fallback below
    }
    const query = encodeURIComponent(flyer.storeAddress);
    const naverUrl = `nmap://search?query=${query}&appname=com.nearpriceapp`;
    const fallbackUrl = `https://map.naver.com/v5/search/${query}`;
    const supported = await Linking.canOpenURL(naverUrl);
    Linking.openURL(supported ? naverUrl : fallbackUrl).catch(() => {
      Alert.alert('오류', '지도 앱을 열 수 없습니다.');
    });
  }, [flyer]);

  const handleProductPress = useCallback((product: FlyerProductItem) => {
    flyerApi.trackProductView(flyerId, product.id).catch(() => {});

    if (flyer?.storeId) {
      const parentNavigation = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
      if (!parentNavigation) {
        Alert.alert('오류', '화면 이동에 실패했습니다. 앱을 다시 실행해 주세요.');
        return;
      }

      parentNavigation.navigate('HomeStack', {
        screen: 'StoreDetail',
        params: { storeId: flyer.storeId },
      });
      return;
    }

    if (flyer?.storeAddress) {
      void handleDirection();
      return;
    }

    Alert.alert('안내', '매장 정보를 찾지 못해 상세 페이지로 이동할 수 없습니다.');
  }, [flyer?.storeAddress, flyer?.storeId, flyerId, handleDirection, navigation]);

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }),
    [insets.bottom],
  );

  const allProducts = useMemo(
    () => flyer?.products ?? [],
    [flyer?.products],
  );
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE)),
    [allProducts.length],
  );

  useEffect(() => {
    if (pageIndex <= pageCount - 1) {
      return;
    }
    setPageIndex(Math.max(0, pageCount - 1));
  }, [pageCount, pageIndex]);

  if (isLoading) {
    return <SkeletonCard variant="price" />;
  }

  if (isError || !flyer) {
    return <ErrorView message="전단지를 불러오지 못했습니다." onRetry={refetch} />;
  }

  const start = pageIndex * PAGE_SIZE;
  const pagedFlyer = {
    ...flyer,
    products: allProducts.slice(start, start + PAGE_SIZE),
  };

  const renderStyle = toFlyerStyle(pagedFlyer.templateType);

  return (
    <View style={styles.screen}>
      {/* 공통 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <ChevronLeftIcon size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>전단지 상세</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="공유하기"
        >
          <ShareIcon size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {renderStyle === 'color' && (
          <ColorFlyerTemplate
            flyer={pagedFlyer}
            onProductPress={handleProductPress}
          />
        )}
        {renderStyle === 'news' && (
          <NewsFlyerTemplate
            flyer={pagedFlyer}
            onProductPress={handleProductPress}
          />
        )}
        {renderStyle === 'riso' && (
          <RisoFlyerTemplate
            flyer={pagedFlyer}
            onProductPress={handleProductPress}
          />
        )}
        {renderStyle === 'poster' && (
          <PosterFlyerTemplate
            flyer={pagedFlyer}
            onProductPress={handleProductPress}
          />
        )}

        {pageCount > 1 && (
          <View style={styles.pageControlsWrap}>
            <TouchableOpacity
              style={[styles.pageButton, pageIndex === 0 && styles.pageButtonDisabled]}
              onPress={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={pageIndex === 0}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="전단지 이전 페이지"
            >
              <Text style={[styles.pageButtonText, pageIndex === 0 && styles.pageButtonTextDisabled]}>이전</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>{pageIndex + 1} / {pageCount}</Text>

            <TouchableOpacity
              style={[styles.pageButton, pageIndex >= pageCount - 1 && styles.pageButtonDisabled]}
              onPress={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={pageIndex >= pageCount - 1}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="전단지 다음 페이지"
            >
              <Text
                style={[
                  styles.pageButtonText,
                  pageIndex >= pageCount - 1 && styles.pageButtonTextDisabled,
                ]}
              >
                다음
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.flyerDetailHeaderBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headingMd,
    color: colors.primary,
    fontWeight: '800' as const,
  },
  scrollView: {
    flex: 1,
  },
  pageControlsWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pageButton: {
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  pageButtonText: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '700' as const,
  },
  pageButtonTextDisabled: {
    color: colors.gray400,
  },
  pageIndicator: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '800' as const,
  },
});

export default FlyerDetailScreen;
