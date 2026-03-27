import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Linking,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { FlyerScreenProps } from '../../navigation/types';
import { useFlyerDetail } from '../../hooks/queries/useFlyers';
import type { FlyerProductItem, FlyerReviewItem } from '../../types/api.types';
import SkeletonCard from '../../components/common/SkeletonCard';
import ErrorView from '../../components/common/ErrorView';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ShareIcon from '../../components/icons/ShareIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import ThumbUpIcon from '../../components/icons/ThumbUpIcon';
import { formatPrice } from '../../utils/format';

type Props = FlyerScreenProps<'FlyerDetail'>;

type BadgeType = 'red' | 'yellow' | 'blue';

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProductCell: React.FC<{ item: FlyerProductItem }> = ({ item }) => {
  const priceStr = formatPrice(item.salePrice);
  const numPart = priceStr.replace('원', '').trim();

  return (
    <View style={styles.productCell}>
      {/* 뱃지 */}
      {item.badges.length > 0 && (
        <View style={styles.badgeWrap}>
          {item.badges.map((badge) => (
            <View key={badge.label} style={badgeStyleMap[badge.type]}>
              <Text style={[styles.badgeText, badgeTextStyleMap[badge.type]]}>{badge.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 상품 이미지 (다크 배경 + 이모지) */}
      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{item.emoji}</Text>
      </View>

      {/* 상품 정보 */}
      <View style={styles.productInfoWrap}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.productPriceBlock}>
          {item.originalPrice !== null && (
            <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
          )}
          <View style={styles.salePriceRow}>
            <Text style={styles.salePrice}>{numPart}</Text>
            <Text style={styles.salePriceUnit}>원</Text>
          </View>
        </View>
        {/* 장바구니 버튼 — 절대 위치 */}
        <View style={styles.cartBtn} accessibilityElementsHidden={true}>
          <Text style={styles.cartBtnText}>🛒</Text>
        </View>
      </View>
    </View>
  );
};

const ReviewCard: React.FC<{ item: FlyerReviewItem }> = ({ item }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <View style={[styles.reviewAvatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.reviewInitial}>{item.initial}</Text>
      </View>
      <View style={styles.reviewMeta}>
        <Text style={styles.reviewName}>{item.name}</Text>
        <Text style={styles.reviewTime}>{item.meta}</Text>
      </View>
    </View>
    <Text style={styles.reviewContent}>{item.content}</Text>
    {item.helpfulCount !== undefined && (
      <TouchableOpacity
        style={styles.helpfulBtn}
        accessibilityRole="button"
        accessibilityLabel={`도움돼요 ${item.helpfulCount}`}
      >
        <ThumbUpIcon size={13} color={colors.primary} />
        <Text style={styles.helpfulText}>도움돼요 {item.helpfulCount}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const FlyerDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { flyerId } = route.params;
  const { data: flyer, isLoading, isError, refetch } = useFlyerDetail(flyerId);

  const handleShare = useCallback(async () => {
    if (!flyer) return;
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
    if (!flyer?.storeAddress) return;
    const query = encodeURIComponent(flyer.storeAddress);
    const naverUrl = `nmap://search?query=${query}&appname=com.nearprice`;
    const fallbackUrl = `https://map.naver.com/v5/search/${query}`;
    const supported = await Linking.canOpenURL(naverUrl);
    Linking.openURL(supported ? naverUrl : fallbackUrl).catch(() => {
      Alert.alert('오류', '지도 앱을 열 수 없습니다.');
    });
  }, [flyer]);

  const handleCommunityShare = useCallback(async () => {
    if (!flyer) return;
    try {
      await Share.share({ message: `${flyer.storeName} 정보를 이웃과 공유했습니다.` });
    } catch {
      // ignore
    }
  }, [flyer]);

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }),
    [insets.bottom],
  );

  // 상품을 2열 쌍으로 분리
  const productRows = useMemo(() => {
    const rows: FlyerProductItem[][] = [];
    const products = flyer?.products ?? [];
    for (let i = 0; i < products.length; i += 2) {
      rows.push(products.slice(i, i + 2));
    }
    return rows;
  }, [flyer?.products]);

  const ratingStars = flyer?.storeRating != null
    ? '★'.repeat(Math.min(5, Math.round(flyer.storeRating)))
    : '';

  if (isLoading) {
    return <SkeletonCard variant="price" />;
  }

  if (isError || !flyer) {
    return (
      <ErrorView message="전단지를 불러오지 못했습니다." onRetry={refetch} />
    );
  }

  return (
    <View style={styles.screen}>
      {/* ─── 커스텀 헤더 ──────────────────────────────────────────── */}
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
        {/* ─── 히어로 배너 ────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* 장식용 원 */}
          <View style={styles.heroDecorCircle} />
          {/* Weekly Special 뱃지 */}
          <View style={styles.weeklyBadge}>
            <Text style={styles.weeklyBadgeText}>WEEKLY SPECIAL</Text>
          </View>
          {/* 타이틀 */}
          <Text style={styles.heroTitle}>
            {flyer.storeName}{' '}
            <Text style={styles.heroAccent}>{flyer.promotionTitle}</Text>
          </Text>
          {/* 날짜 */}
          <View style={styles.heroDateRow}>
            <View style={styles.heroDateLine} />
            <Text style={styles.heroDateText}>{flyer.dateRange}</Text>
            <View style={styles.heroDateLine} />
          </View>
        </View>

        {/* ─── 상품 그리드 ────────────────────────────────────────── */}
        <View style={styles.productGrid}>
          {productRows.map((row, rowIdx) => (
            <View
              key={row[0]?.id ?? rowIdx}
              style={[styles.productRow, rowIdx > 0 && styles.productRowBorder]}
            >
              {row.map((product, colIdx) => (
                <View
                  key={product.id}
                  style={[styles.productCellWrap, colIdx === 0 && styles.productCellWrapBorderRight]}
                >
                  <ProductCell item={product} />
                </View>
              ))}
              {/* 홀수 열 마지막 셀이 없으면 빈 공간 */}
              {row.length === 1 && <View style={styles.productCellWrap} />}
            </View>
          ))}
        </View>

        {/* ─── 경고 배너 ──────────────────────────────────────────── */}
        {flyer.warningText ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{flyer.warningText}</Text>
          </View>
        ) : null}

        {/* ─── 점장의 약속 ─────────────────────────────────────────── */}
        {(flyer.ownerName || flyer.ownerQuote) ? (
          <View style={styles.ownerSection}>
            <View style={styles.ownerCard}>
              {/* 큰따옴표 장식 */}
              <Text style={styles.ownerQuoteDecor}>"</Text>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatarWrap}>
                  <Text style={styles.ownerAvatarEmoji}>🏪</Text>
                </View>
                <View>
                  {flyer.ownerRole ? <Text style={styles.ownerRole}>{flyer.ownerRole}</Text> : null}
                  {flyer.ownerName ? <Text style={styles.ownerName}>{flyer.ownerName}</Text> : null}
                </View>
              </View>
              {flyer.ownerQuote ? <Text style={styles.ownerQuote}>{flyer.ownerQuote}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* ─── 매장 정보 ──────────────────────────────────────────── */}
        {flyer.storeAddress ? (
          <View style={styles.martSection}>
            <View style={styles.martCard}>
            <View style={styles.martNameRow}>
              <Text style={styles.martName}>{flyer.storeName}</Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>인기 매장</Text>
              </View>
            </View>
            <View style={styles.martAddressRow}>
              <MapPinIcon size={14} color={colors.gray600} />
              <Text style={styles.martAddress}>{flyer.storeAddress}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>{ratingStars}</Text>
              <Text style={styles.ratingNum}>{flyer.storeRating}</Text>
              <Text style={styles.ratingCount}>(리뷰 {flyer.storeReviewCount ?? '-'})</Text>
            </View>
            <View style={styles.martBtns}>
              <TouchableOpacity
                style={styles.directionBtnWrap}
                onPress={handleDirection}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="길찾기"
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.directionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.directionBtnIcon}>🧭</Text>
                  <Text style={styles.directionBtnText}>길찾기</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        ) : null}

        {/* ─── 이웃들의 실시간 정보 ───────────────────────────────── */}
        <View style={styles.communitySection}>
          <View style={styles.communityHeader}>
            <Text style={styles.communityTitle}>이웃들의 실시간 정보</Text>
            <View style={styles.realtimeBadge}>
              <Text style={styles.realtimeBadgeText}>Real-time</Text>
            </View>
          </View>

          <View style={styles.reviewList}>
            {(flyer.reviews ?? []).map((review) => (
              <ReviewCard key={review.id} item={review} />
            ))}
          </View>

          <TouchableOpacity
            style={styles.shareInfoBtn}
            onPress={handleCommunityShare}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="정보 공유하기"
          >
            <Text style={styles.shareInfoBtnText}>정보 공유하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },

  // ── 헤더 ──
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

  // ── 히어로 배너 ──
  hero: {
    backgroundColor: colors.flyerHeroRed,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroDecorCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.flyerBadgeYellow,
    opacity: 0.18,
    top: -30,
    right: -20,
  },
  weeklyBadge: {
    backgroundColor: colors.flyerBadgeYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
    marginBottom: spacing.md,
  },
  weeklyBadgeText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: colors.flyerHeroRed,
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900' as const,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontStyle: 'italic',
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  heroAccent: {
    color: colors.flyerBadgeYellow,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroDateLine: {
    width: 28,
    height: 1,
    backgroundColor: colors.flyerHeroDateLine,
  },
  heroDateText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.flyerHeroDateText,
    letterSpacing: 0.5,
  },

  // ── 상품 그리드 ──
  productGrid: {
    backgroundColor: colors.gray200,
    gap: 1,
  },
  productRow: {
    flexDirection: 'row',
    gap: 1,
  },
  productRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  productCellWrap: {
    flex: 1,
    backgroundColor: colors.white,
  },
  productCellWrapBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.gray200,
  },
  productCell: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },

  // 뱃지
  badgeWrap: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 1,
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
  },
  badgeRed: {
    backgroundColor: colors.flyerRed,
  },
  badgeYellow: {
    backgroundColor: colors.flyerBadgeYellow,
  },
  badgeBlue: {
    backgroundColor: colors.flyerBadgeBlue,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900' as const,
  },
  badgeTextLight: {
    color: colors.white,
  },
  badgeTextDark: {
    color: colors.black,
  },

  // 상품 이미지
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.flyerProductDark,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  productEmoji: {
    fontSize: 40,
  },

  // 상품 정보
  productInfoWrap: {
    paddingRight: spacing.xxl + spacing.sm,
    position: 'relative',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.black,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  productPriceBlock: {
    gap: 1,
  },
  originalPrice: {
    fontSize: 10,
    color: colors.gray400,
    textDecorationLine: 'line-through',
    fontWeight: '500' as const,
  },
  salePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  salePrice: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.flyerRed,
    lineHeight: 24,
  },
  salePriceUnit: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.flyerRed,
  },

  // 장바구니 버튼
  cartBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnText: {
    fontSize: 15,
  },

  // ── 경고 배너 ──
  warningBanner: {
    backgroundColor: colors.flyerBadgeYellow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: colors.flyerHeroRed,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // ── 점장의 약속 ──
  ownerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusXl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray100,
    overflow: 'hidden',
  },
  ownerQuoteDecor: {
    position: 'absolute',
    right: spacing.lg,
    top: -spacing.sm,
    fontSize: 80,
    color: colors.primary,
    opacity: 0.06,
    fontWeight: '900' as const,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ownerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarEmoji: {
    fontSize: 24,
  },
  ownerRole: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: colors.primary,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  ownerQuote: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray900,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // ── 매장 정보 ──
  martSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  martCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusXl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  martNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  martName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  popularBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.olive,
  },
  martAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  martAddress: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  ratingStars: {
    fontSize: 16,
    color: colors.starYellow,
  },
  ratingNum: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.black,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },
  martBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  directionBtnWrap: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  directionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  directionBtnIcon: {
    fontSize: 18,
  },
  directionBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },

  // ── 커뮤니티 섹션 ──
  communitySection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  realtimeBadge: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  realtimeBadgeText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  reviewList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  reviewCard: {
    backgroundColor: colors.surfaceBg,
    borderRadius: spacing.radiusXl,
    padding: spacing.xl,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitial: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: colors.primary,
  },
  reviewMeta: {
    gap: 2,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.black,
  },
  reviewTime: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.gray600,
  },
  reviewContent: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.gray700,
    lineHeight: 20,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.primary,
  },

  // 정보 공유하기
  shareInfoBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray200,
    borderRadius: spacing.radiusXl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  shareInfoBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.gray600,
  },
});

// 모듈 스코프: styles 참조를 위해 StyleSheet.create 이후에 선언
const badgeStyleMap: Record<BadgeType, ViewStyle[]> = {
  red: [styles.badge, styles.badgeRed],
  yellow: [styles.badge, styles.badgeYellow],
  blue: [styles.badge, styles.badgeBlue],
};

const badgeTextStyleMap: Record<BadgeType, TextStyle> = {
  red: styles.badgeTextLight,
  yellow: styles.badgeTextDark,
  blue: styles.badgeTextLight,
};

export default FlyerDetailScreen;
