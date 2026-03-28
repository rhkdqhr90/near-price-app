import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, PJS } from '../../theme/typography';
import { formatPrice, formatRelativeTime, fixImageUrl, formatDate } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../../components/icons/ChevronRightIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import ShareIcon from '../../components/icons/ShareIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import { useVerifications, useVerifyPrice } from '../../hooks/queries/useVerification';
import { usePriceDetail, useProductPricesByName } from '../../hooks/queries/usePrices';
import { usePriceTrustScore } from '../../hooks/queries/usePriceTrustScore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { isAxiosError } from '../../api/client';
import type { ProductCategory } from '../../types/api.types';

type Props = HomeScreenProps<'PriceDetail'>;

const HORIZONTAL_PADDING = spacing.xxl; // 24

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  vegetable: '채소',
  fruit: '과일',
  meat: '육류',
  seafood: '해산물',
  dairy: '유제품',
  grain: '곡류',
  processed: '가공식품',
  household: '생활용품',
  other: '기타',
};

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const PriceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { priceId } = route.params;
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputePrice, setDisputePrice] = useState('');
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.showToast);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const regionName = useLocationStore((s) => s.regionName);
  const insets = useSafeAreaInsets();

  const bottomSpacerStyle = useMemo(
    () => ({ height: spacing.xxl + insets.bottom }),
    [insets.bottom],
  );

  const headerDynamicStyle = useMemo(
    () => [styles.header, { paddingTop: insets.top }],
    [insets.top],
  );

  const {
    data: price,
    isLoading,
    isError,
    refetch,
  } = usePriceDetail(priceId);

  const { data: verifications } = useVerifications(priceId);
  const { data: trustScore } = usePriceTrustScore(priceId);
  const { mutate: verifyPrice, isPending: isVerifying } = useVerifyPrice(priceId);

  const { data: allPricesData, isLoading: isRankLoading } = useProductPricesByName(price?.product.name ?? '');

  const rankedPrices = useMemo(() => {
    if (!allPricesData) return [];
    return [...allPricesData].sort((a, b) => a.price - b.price);
  }, [allPricesData]);

  const currentRank = useMemo<number | null>(() => {
    if (!allPricesData) return null;
    const idx = rankedPrices.findIndex(p => p.id === priceId);
    return idx >= 0 ? idx + 1 : null;
  }, [allPricesData, rankedPrices, priceId]);

  const otherTop2 = useMemo(
    () => rankedPrices
      .map((p, idx) => ({ price: p, rank: idx + 1 }))
      .filter(({ price: p }) => p.id !== priceId)
      .slice(0, 2),
    [rankedPrices, priceId],
  );

  const handleStorePress = useCallback(() => {
    if (price?.store.id) {
      navigation.navigate('StoreDetail', { storeId: price.store.id });
    }
  }, [navigation, price]);

  const hasVerified = verifications?.data?.some(
    (v) => v.verifier?.id === currentUserId,
  ) ?? false;

  const isOwnPrice = !!currentUserId && price?.user?.id === currentUserId;

  const handleConfirmPrice = useCallback(() => {
    verifyPrice(
      { result: 'confirmed' },
      {
        onSuccess: () => {
          showToast('가격을 확인했어요!', 'success');
        },
        onError: () => {
          showToast('가격 확인 처리에 실패했습니다.', 'error');
        },
      },
    );
  }, [verifyPrice, showToast]);

  const handleDisputeSubmit = useCallback(() => {
    const trimmed = disputePrice.trim();
    if (!/^\d+$/.test(trimmed)) {
      setDisputeError('숫자만 입력해 주세요');
      return;
    }
    const actualPrice = parseInt(trimmed, 10);
    if (actualPrice <= 0) {
      setDisputeError('0원보다 큰 가격을 입력해 주세요');
      return;
    }
    if (actualPrice > 10_000_000) {
      setDisputeError('10,000,000원 이하로 입력해 주세요');
      return;
    }
    setDisputeError(null);
    verifyPrice(
      { result: 'disputed', actualPrice },
      {
        onSuccess: () => {
          setShowDisputeModal(false);
          setDisputePrice('');
          setDisputeError(null);
          showToast('이의 제기가 등록되었어요', 'success');
        },
        onError: (err) => {
          const msg = isAxiosError<{ message?: string }>(err)
            ? err.response?.data?.message
            : undefined;
          setDisputeError(msg ?? '이의 제기에 실패했어요');
        },
      },
    );
  }, [disputePrice, verifyPrice, showToast]);

  const handleShare = useCallback(async () => {
    if (!price) return;
    try {
      const message = `[마실] ${price.product.name} ${formatPrice(price.price)} - ${price.store.name}\n${price.store.address}\n내 동네 최저가를 찾아보세요!`;
      await Share.share({ message });
    } catch {
      showToast('공유할 수 없어요', 'error');
    }
  }, [price, showToast]);

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <ChevronLeftIcon size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (isError || !price) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <ChevronLeftIcon size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={WifiOffIcon}
          title="정보를 불러올 수 없어요"
          subtitle="네트워크 상태를 확인하고 다시 시도해 주세요."
          action={{ label: '다시 시도', onPress: refetch }}
        />
      </SafeAreaView>
    );
  }

  const imageUri = fixImageUrl(price.imageUrl);
  const hasSale = !!(price.saleStartDate && price.saleEndDate);
  const categoryLabel = CATEGORY_LABELS[price.product.category] ?? '기타';
  const priceInt = Math.floor(price.price);
  const priceFormatted = priceInt.toLocaleString('ko-KR');
  const verificationList = verifications?.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* ─── Sticky Header ───────────────────────────────────────────────── */}
      <View style={headerDynamicStyle}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <ChevronLeftIcon size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MapPinIcon size={14} color={colors.primary} />
          <Text style={styles.headerLocationText} numberOfLines={1}>
            {regionName ?? '동네'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Search', { initialQuery: undefined })}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <SearchIcon size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="공유하기"
          >
            <ShareIcon size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scroll Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ─── 상품 이미지 ─────────────────────────────────────────────── */}
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              resizeMode="cover"
              accessible
              accessibilityLabel={`${price.product.name} 가격표 사진`}
            />
          ) : (
            <View style={styles.imagePlaceholder} accessible accessibilityLabel="사진 없음">
              <Text style={styles.imagePlaceholderText}>사진 없음</Text>
            </View>
          )}
        </View>

        {/* ─── 상품 정보 ───────────────────────────────────────────────── */}
        <View style={styles.productInfoSection}>
          {/* 배지 row */}
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            {hasSale && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>할인 중</Text>
              </View>
            )}
          </View>

          {/* 상품명 */}
          <Text style={styles.productName} numberOfLines={2}>
            {price.product.name}
          </Text>

          {/* 가격 */}
          <View style={styles.priceRow}>
            <Text style={styles.priceNumber}>{priceFormatted}</Text>
            <Text style={styles.priceUnit}>원</Text>
          </View>

          {/* 메타 */}
          <Text style={styles.metaText}>
            {price.store.name}
            {' · '}
            {formatRelativeTime(price.createdAt)}
            {price.verificationCount > 0 ? ` · 검증 ${price.verificationCount}명` : ''}
          </Text>

          {/* 맞아요/달라요 버튼 — 본인 등록 아닐 때만 */}
          {!isOwnPrice && (
            <View style={styles.verifyBtnRow}>
              {isVerifying ? (
                <View style={styles.verifyingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.verifyingText}>검증 중...</Text>
                </View>
              ) : hasVerified ? (
                <View style={styles.verifiedContainer}>
                  <Text style={styles.verifiedText}>검증에 참여했어요 ✓</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.verifyBtn, styles.confirmBtn]}
                    onPress={handleConfirmPrice}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="가격이 맞아요"
                  >
                    <Text style={styles.confirmBtnText}>맞아요 ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.verifyBtn, styles.disputeBtn]}
                    onPress={() => setShowDisputeModal(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="가격이 달라요"
                  >
                    <Text style={styles.disputeBtnText}>달라요 ✗</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* ─── 7일 가격 트렌드 카드 ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.trendHeader}>
            <Text style={styles.cardTitle}>7일 가격 트렌드</Text>
            {trustScore && (
              <Text style={styles.trendSubLabel}>
                30일 최저가 {trustScore.status === 'scored' ? formatPrice(price.price) : '-'}
              </Text>
            )}
          </View>
          <View style={styles.chartPlaceholder} />
          <View style={styles.weekDayRow}>
            {WEEK_DAYS.map((d) => (
              <Text key={d} style={styles.weekDayLabel}>{d}</Text>
            ))}
          </View>
        </View>

        {/* ─── 매장 가격 순위 카드 ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.rankSectionTitle}>매장 가격 순위</Text>

          {/* 현재 매장 (실제 순위) */}
          <View style={styles.rank1Card}>
            <View style={styles.rank1TopRow}>
              <View style={styles.rank1NumCircle}>
                <Text style={styles.rank1NumText}>{currentRank ?? '-'}</Text>
              </View>
              {currentRank === 1 && (
                <View style={styles.lowestBadge}>
                  <Text style={styles.lowestBadgeText}>최저가</Text>
                </View>
              )}
            </View>

            {/* 매장 정보 + 가격 가로 배치 */}
            <View style={styles.rank1MidRow}>
              <View style={styles.rank1StoreInfo}>
                <Text style={styles.rank1StoreName}>{price.store.name}</Text>
                <Text style={styles.rank1SubText} numberOfLines={1}>
                  {price.store.address}
                </Text>
              </View>
              <View style={styles.rank1PriceBlock}>
                <Text style={styles.rank1Price}>{formatPrice(price.price)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={handleStorePress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="매장 상세 보기"
            >
              <Text style={styles.directionsBtnText}>매장 상세 보기</Text>
            </TouchableOpacity>
          </View>

          {/* 다른 매장 순위 */}
          <View style={styles.rank23Row}>
            {isRankLoading ? (
              [2, 3].map((rank) => (
                <View key={rank} style={styles.rank23Card}>
                  <View style={styles.rank23Left}>
                    <View style={styles.rank23NumCircle}>
                      <Text style={styles.rank23NumText}>{rank}</Text>
                    </View>
                    <View style={styles.rank23TextBlock}>
                      <Text style={styles.rank23StoreName}>-</Text>
                      <Text style={styles.rank23SubText}>불러오는 중...</Text>
                    </View>
                  </View>
                  <ChevronRightIcon size={18} color={colors.gray400} />
                </View>
              ))
            ) : otherTop2.length > 0 ? (
              otherTop2.map(({ price: otherPrice, rank }) => (
                <TouchableOpacity
                  key={otherPrice.id}
                  style={styles.rank23Card}
                  onPress={() => navigation.navigate('PriceDetail', { priceId: otherPrice.id })}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${rank}위 ${otherPrice.store.name} 가격 상세 보기`}
                >
                  <View style={styles.rank23Left}>
                    <View style={styles.rank23NumCircle}>
                      <Text style={styles.rank23NumText}>{rank}</Text>
                    </View>
                    <View style={styles.rank23TextBlock}>
                      <Text style={styles.rank23StoreName}>{otherPrice.store.name}</Text>
                      <Text style={styles.rank23SubText}>{formatPrice(otherPrice.price)}</Text>
                    </View>
                  </View>
                  <ChevronRightIcon size={18} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              [
                { rank: 2, label: '다른 매장을 검색해 보세요' },
                { rank: 3, label: '가격을 등록해 보세요' },
              ].map(({ rank, label }) => (
                <View key={rank} style={styles.rank23Card}>
                  <View style={styles.rank23Left}>
                    <View style={styles.rank23NumCircle}>
                      <Text style={styles.rank23NumText}>{rank}</Text>
                    </View>
                    <View style={styles.rank23TextBlock}>
                      <Text style={styles.rank23StoreName}>-</Text>
                      <Text style={styles.rank23SubText}>{label}</Text>
                    </View>
                  </View>
                  <ChevronRightIcon size={18} color={colors.gray400} />
                </View>
              ))
            )}
          </View>
        </View>

        {/* ─── 가격 인증 현황 카드 ─────────────────────────────────────── */}
        {(!isOwnPrice || verificationList.length > 0) && (
          <View style={[styles.card, styles.cardLast]}>
            <Text style={styles.cardTitle}>가격 인증 현황</Text>

            {verificationList.length === 0 ? (
              <Text style={styles.noVerificationText}>아직 인증한 사람이 없어요</Text>
            ) : (
              verificationList.map((v, idx) => (
                <View
                  key={v.id}
                  style={[
                    styles.verificationItem,
                    idx < verificationList.length - 1 && styles.verificationItemBorder,
                  ]}
                >
                  <View style={styles.verificationAvatar}>
                    <Text style={styles.verificationAvatarText}>
                      {(v.verifier?.nickname ?? '?')[0]}
                    </Text>
                  </View>
                  <View style={styles.verificationInfo}>
                    <Text style={styles.verificationName}>
                      {v.verifier?.nickname ?? '알 수 없음'}
                    </Text>
                    <Text style={styles.verificationTime}>
                      {formatRelativeTime(v.createdAt)}
                    </Text>
                  </View>
                  <View style={[
                    styles.verificationResultBadge,
                    v.result === 'confirmed' ? styles.confirmedResultBadge : styles.disputedResultBadge,
                  ]}>
                    <Text style={[
                      styles.verificationResultText,
                      v.result === 'confirmed' ? styles.confirmedResultText : styles.disputedResultText,
                    ]}>
                      {v.result === 'confirmed' ? '맞아요' : '달라요'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* 세일 기간 정보 (있을 때) */}
        {(price.saleStartDate || price.saleEndDate) && (
          <View style={[styles.card, styles.cardLast]}>
            <Text style={styles.cardTitle}>세일 기간</Text>
            <Text style={styles.saleText}>
              {price.saleStartDate ? formatDate(price.saleStartDate) : ''}
              {price.saleStartDate && price.saleEndDate ? ' ~ ' : ''}
              {price.saleEndDate ? formatDate(price.saleEndDate) : ''}
            </Text>
          </View>
        )}

        <View style={bottomSpacerStyle} />
      </ScrollView>

      {/* ─── Dispute Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showDisputeModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDisputeModal(false);
          setDisputePrice('');
          setDisputeError(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowDisputeModal(false);
              setDisputePrice('');
              setDisputeError(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="모달 닫기"
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>실제 가격 입력</Text>
            <Text style={styles.modalSubtitle}>
              현재 표시된 가격이 다르다면 실제 확인한 가격을 입력해 주세요.
            </Text>
            <TextInput
              style={styles.disputeInput}
              placeholder="실제 가격 (원)"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              value={disputePrice}
              onChangeText={(v) => {
                setDisputePrice(v);
                if (disputeError) setDisputeError(null);
              }}
              autoFocus
              accessibilityLabel="실제 가격 입력"
            />
            {disputeError ? (
              <Text style={styles.disputeErrorText}>{disputeError}</Text>
            ) : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setShowDisputeModal(false);
                  setDisputePrice('');
                  setDisputeError(null);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="취소"
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalSubmitBtn,
                  (isVerifying || !disputePrice.trim() || !/^\d+$/.test(disputePrice.trim())) &&
                    styles.modalBtnDisabled,
                ]}
                onPress={handleDisputeSubmit}
                disabled={isVerifying || !disputePrice.trim() || !/^\d+$/.test(disputePrice.trim())}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="이의 제기 제출"
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>제출</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerIconBtn: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  headerLocationText: {
    ...typography.headingMd,
    fontFamily: PJS.bold,
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ─── Loading / Error ───────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Scroll ───────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.lg,
  },

  // ─── 상품 이미지 ───────────────────────────────────────────────────────────
  imageWrapper: {
    aspectRatio: 1,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    backgroundColor: colors.surfaceContainerLow,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: spacing.shadowOffsetYMd },
    shadowOpacity: 0.10,
    shadowRadius: spacing.shadowRadiusXl,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    ...typography.bodySm,
    color: colors.gray400,
  },

  // ─── 상품 정보 섹션 ────────────────────────────────────────────────────────
  productInfoSection: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
  },
  categoryBadgeText: {
    ...typography.captionBold,
    color: colors.onTertiaryContainer,
  },
  saleBadge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
  },
  saleBadgeText: {
    ...typography.captionBold,
    color: colors.onErrorContainer,
  },
  productName: {
    ...typography.productDetailTitle,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  priceNumber: {
    ...typography.priceHero,
    color: colors.onBackground,
  },
  priceUnit: {
    ...typography.priceHeroUnit,
    color: colors.onSurfaceVariant,
    alignSelf: 'flex-end',
    paddingBottom: spacing.xs,
  },
  metaText: {
    ...typography.labelSm,
    color: colors.outlineColor,
    marginTop: spacing.xs,
  },

  // ─── 맞아요/달라요 버튼 ────────────────────────────────────────────────────
  verifyBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  verifyBtn: {
    flex: 1,
    borderRadius: spacing.radiusLg,
    paddingVertical: spacing.inputPad,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: colors.successContainer,
  },
  confirmBtnText: {
    ...typography.labelMd,
    color: colors.onSuccessContainer,
  },
  disputeBtn: {
    backgroundColor: colors.errorContainer,
  },
  disputeBtnText: {
    ...typography.labelMd,
    color: colors.onErrorContainer,
  },
  verifyingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.inputPad,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusLg,
  },
  verifyingText: {
    ...typography.body,
    color: colors.primary,
  },
  verifiedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.inputPad,
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusLg,
  },
  verifiedText: {
    ...typography.labelMd,
    color: colors.primary,
  },

  // ─── 공통 카드 ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: spacing.radiusLg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: spacing.shadowOffsetY },
    shadowOpacity: 0.06,
    shadowRadius: spacing.shadowRadiusMd,
    elevation: 2,
  },
  cardLast: {
    marginBottom: 0,
  },
  cardTitle: {
    ...typography.labelMd,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  // ─── 7일 가격 트렌드 ──────────────────────────────────────────────────────
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  trendSubLabel: {
    ...typography.caption,
    color: colors.tertiary,
  },
  chartPlaceholder: {
    height: spacing.priceDetailChartH,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.sm,
  },
  weekDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDayLabel: {
    ...typography.tabLabel,
    fontFamily: PJS.semiBold,
    color: colors.outlineColor,
  },

  // ─── 매장 가격 순위 ───────────────────────────────────────────────────────
  rankSectionTitle: {
    ...typography.headingLg,
    fontFamily: PJS.extraBold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  rank1Card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: spacing.borderEmphasis,
    borderColor: colors.tertiaryFixedDim,
    borderRadius: spacing.radiusLg,
    padding: spacing.xxl,
    marginBottom: spacing.md,
  },
  rank1TopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rank1NumCircle: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.tertiaryFixedDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank1NumText: {
    ...typography.activityCount,
    fontFamily: PJS.extraBold,
    color: colors.onTertiary,
  },
  lowestBadge: {
    backgroundColor: colors.tertiary,
    paddingHorizontal: spacing.badgePadH,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
  },
  lowestBadgeText: {
    ...typography.captionBold,
    color: colors.white,
  },
  rank1StoreName: {
    ...typography.headingLg,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  rank1SubText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  rank1MidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  rank1StoreInfo: {
    flex: 1,
  },
  rank1PriceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  rank1Price: {
    ...typography.price,
    color: colors.tertiary,
    fontSize: 22,
  },
  directionsBtn: {
    width: '100%',
    backgroundColor: colors.tertiary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  directionsBtnText: {
    ...typography.labelMd,
    color: colors.white,
  },
  rank23Row: {
    gap: spacing.sm,
  },
  rank23Card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusLg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rank23Left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rank23NumCircle: {
    width: spacing.priceDetailRankCircleSm,
    height: spacing.priceDetailRankCircleSm,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank23NumText: {
    ...typography.headingMd,
    fontFamily: PJS.bold,
    color: colors.gray700,
  },
  rank23TextBlock: {
    flex: 1,
  },
  rank23StoreName: {
    ...typography.labelMd,
    color: colors.onBackground,
    marginBottom: spacing.micro,
  },
  rank23SubText: {
    ...typography.labelSm,
    color: colors.outlineColor,
  },

  // ─── 가격 인증 현황 ───────────────────────────────────────────────────────
  noVerificationText: {
    ...typography.bodySm,
    color: colors.gray400,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  verificationItemBorder: {
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  verificationAvatar: {
    width: spacing.priceDetailVerifyAvatarSize,
    height: spacing.priceDetailVerifyAvatarSize,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  verificationAvatarText: {
    ...typography.headingLg,
    color: colors.primary,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationName: {
    ...typography.labelMd,
    color: colors.onBackground,
    marginBottom: spacing.micro,
  },
  verificationTime: {
    ...typography.labelSm,
    color: colors.outlineColor,
  },
  verificationResultBadge: {
    paddingHorizontal: spacing.badgePadH,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
  },
  confirmedResultBadge: {
    backgroundColor: colors.successContainer,
  },
  disputedResultBadge: {
    backgroundColor: colors.errorContainer,
  },
  verificationResultText: {
    ...typography.labelSm,
    fontFamily: PJS.bold,
  },
  confirmedResultText: {
    color: colors.onSuccessContainer,
  },
  disputedResultText: {
    color: colors.onErrorContainer,
  },
  saleText: {
    ...typography.body,
    color: colors.onBackground,
  },

  // ─── Dispute Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.modalOverlay,
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    padding: spacing.xxl,
  },
  modalHandle: {
    width: spacing.headerIconSize,
    height: spacing.xs,
    backgroundColor: colors.gray200,
    borderRadius: spacing.radiusFull,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headingLg,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.bodySm,
    marginBottom: spacing.lg,
  },
  disputeInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  disputeErrorText: {
    ...typography.error,
    marginBottom: spacing.sm,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: colors.surfaceContainerLow,
  },
  modalCancelBtnText: {
    ...typography.body,
    fontFamily: PJS.semiBold,
    color: colors.gray700,
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
  },
  modalSubmitBtnText: {
    ...typography.body,
    fontFamily: PJS.bold,
    color: colors.white,
  },
  modalBtnDisabled: {
    opacity: spacing.disabledOpacity,
  },
});

export default PriceDetailScreen;
