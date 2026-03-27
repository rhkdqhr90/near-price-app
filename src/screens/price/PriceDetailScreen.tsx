import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatPrice, formatRelativeTime, fixImageUrl } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';
import WifiOffIcon from '../../components/icons/WifiOffIcon';
import { useVerifications, useVerifyPrice } from '../../hooks/queries/useVerification';
import { usePriceDetail } from '../../hooks/queries/usePrices';
import { usePriceTrustScore } from '../../hooks/queries/usePriceTrustScore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

type Props = HomeScreenProps<'PriceDetail'>;

const PriceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { priceId } = route.params;
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputePrice, setDisputePrice] = useState('');
  const showToast = useToastStore((s) => s.showToast);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const {
    data: price,
    isLoading,
    isError,
    refetch,
  } = usePriceDetail(priceId);

  const { data: verifications } = useVerifications(priceId);
  const { data: trustScore } = usePriceTrustScore(priceId);
  const { mutate: verifyPrice, isPending: isVerifying } = useVerifyPrice(priceId);

  const handleStorePress = useCallback(() => {
    if (price?.store.id) {
      navigation.navigate('StoreDetail', { storeId: price.store.id });
    }
  }, [navigation, price]);

  const hasVerified = verifications?.data?.some(
    (v) => v.verifier?.id === currentUserId,
  ) ?? false;

  const handleConfirmPrice = useCallback(() => {
    verifyPrice({ result: 'confirmed' });
  }, [verifyPrice]);

  const handleDisputeSubmit = useCallback(() => {
    const actualPrice = parseInt(disputePrice, 10);
    if (isNaN(actualPrice) || actualPrice <= 0) {
      showToast('올바른 가격을 입력해 주세요', 'error');
      return;
    }
    verifyPrice(
        { result: 'disputed', actualPrice },
        {
          onSuccess: () => {
            setShowDisputeModal(false);
            setDisputePrice('');
          },
          onError: () => {
            showToast('이의 제기에 실패했어요', 'error');
          },
        },
      );
  }, [disputePrice, verifyPrice, showToast]);

  const handleShare = useCallback(async () => {
    if (!price) return;
    try {
      const message = `[마실] ${price.product?.name ?? '상품'} ${formatPrice(price.price)} - ${price.store.name}\n${price.store.address}\n내 동네 최저가를 찾아보세요!`;
      await Share.share({
        message,
      });
    } catch {
      showToast('공유할 수 없어요', 'error');
    }
  }, [price, showToast]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !price) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{price.product?.name ?? '상품'}</Text>
        <View style={styles.backButton} />
      </View>

      {/* 콘텐츠 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 가격표 사진 */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.priceImage}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`${price.product?.name ?? '상품'} 가격표 사진`}
          />
        ) : (
          <View style={styles.priceImagePlaceholder} accessible={true} accessibilityLabel="사진 없음">
            <Text style={styles.placeholderText}>사진 없음</Text>
          </View>
        )}

        {/* 가격 크게 표시 */}
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>{formatPrice(price.price)}</Text>
          {price.quantity ? (
            <Text style={styles.priceQuantity}>{price.quantity}개</Text>
          ) : null}
        </View>

        {/* 등록자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>등록자</Text>
          <View style={styles.sectionRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(price.user?.nickname || price.user?.email || '?')[0]}
              </Text>
            </View>
            <View style={styles.sectionRowContent}>
              <Text style={styles.sectionValue}>
                {price.user?.nickname || price.user?.email || '익명'}
              </Text>
              {price.user && (
                <Text style={styles.sectionSubValue}>
                  신뢰도 {price.user.trustScore}점
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 매장 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매장</Text>
          <Text style={styles.storeName}>{price.store.name}</Text>
          <Text style={styles.storeAddress}>{price.store.address}</Text>
        </View>

        {/* 가격 신뢰도 */}
        {(price.verificationCount > 0 || price.trustScore !== null || trustScore) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>가격 신뢰도</Text>
            {trustScore && (
              <View style={styles.trustStatusRow}>
                <View style={[
                  styles.trustStatusBadge,
                  trustScore.status === 'scored' && styles.trustStatusScored,
                  trustScore.status === 'verifying' && styles.trustStatusVerifying,
                  trustScore.status === 'new' && styles.trustStatusNew,
                ]}>
                  <Text style={[
                    styles.trustStatusText,
                    trustScore.status === 'scored' && styles.trustStatusTextScored,
                    trustScore.status === 'verifying' && styles.trustStatusTextVerifying,
                    trustScore.status === 'new' && styles.trustStatusTextNew,
                  ]}>
                    {trustScore.status === 'scored' && (
                      trustScore.trustScore !== null
                        ? `신뢰도 ${Math.round(trustScore.trustScore)}%`
                        : '신뢰도 계산 중'
                    )}
                    {trustScore.status === 'verifying' && '검증 중'}
                    {trustScore.status === 'new' && '신규 등록'}
                  </Text>
                </View>
                {trustScore.isStale && (
                  <Text style={styles.staleText}>오래된 정보일 수 있어요</Text>
                )}
              </View>
            )}
            <View style={styles.trustRow}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeText}>
                  확인 {price.confirmedCount}
                </Text>
              </View>
              <View style={[styles.trustBadge, styles.trustBadgeDisputed]}>
                <Text style={[styles.trustBadgeText, styles.trustBadgeDisputedText]}>
                  이의 {price.disputedCount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 가격 검증 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이 가격이 맞나요?</Text>

          {isVerifying ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingButtonText}>검증 중...</Text>
            </View>
          ) : hasVerified ? (
            <View style={styles.verifiedStateContainer}>
              <Text style={styles.verifiedStateText}>검증에 참여했어요 ✓</Text>
            </View>
          ) : (
            <View style={styles.verificationButtonRow}>
              <TouchableOpacity
                style={[styles.verificationButton, styles.confirmButton]}
                onPress={handleConfirmPrice}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="가격이 맞아요"
              >
                <Text style={styles.verificationButtonText}>맞아요 ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verificationButton, styles.disputeButton]}
                onPress={() => setShowDisputeModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="가격이 달라요"
              >
                <Text style={styles.verificationButtonTextDispute}>달라요 ✗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 검증자 목록 */}
          {verifications && verifications.data && verifications.data.length > 0 && (
            <View style={styles.verifiersContainer}>
              <Text style={styles.verifiersTitle}>검증자 ({verifications.meta.total}명)</Text>
              {verifications.data.map((verification, index) => (
                <View key={verification.id} style={[styles.verifierItem, index === verifications.data.length - 1 && styles.verifierItemLast]}>
                  <View style={styles.verifierAvatarCircle}>
                    <Text style={styles.verifierAvatarText}>
                      {(verification.verifier?.nickname || '?')[0]}
                    </Text>
                  </View>
                  <View style={styles.verifierInfo}>
                    <Text style={styles.verifierName}>{verification.verifier?.nickname}</Text>
                    <Text style={styles.verifierTrust}>신뢰도 {verification.verifier?.trustScore}점</Text>
                  </View>
                  <View style={[
                    styles.verificationBadge,
                    verification.result === 'confirmed'
                      ? styles.verificationBadgeConfirmed
                      : styles.verificationBadgeDisputed,
                  ]}>
                    <Text style={[
                      styles.verificationBadgeText,
                      verification.result === 'confirmed'
                        ? styles.verificationBadgeTextConfirmed
                        : styles.verificationBadgeTextDisputed,
                    ]}>
                      {verification.result === 'confirmed' ? '맞아요' : '달라요'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 상품 상태 */}
        {price.condition ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>상품 상태</Text>
            <Text style={styles.sectionValue}>{price.condition}</Text>
          </View>
        ) : null}

        {/* 세일 기간 */}
        {(price.saleStartDate || price.saleEndDate) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>세일 기간</Text>
            <Text style={styles.sectionValue}>
              {price.saleStartDate && `${price.saleStartDate.toString().split('T')[0]}`}
              {price.saleStartDate && price.saleEndDate && ' ~ '}
              {price.saleEndDate && `${price.saleEndDate.toString().split('T')[0]}`}
            </Text>
          </View>
        ) : null}

        {/* 등록 일시 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>등록 일시</Text>
          <Text style={styles.sectionValue}>{formatRelativeTime(price.createdAt)}</Text>
          <Text style={styles.sectionSubValue}>
            {new Date(price.createdAt).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>

        {/* 달라요 모달 */}
        <Modal
          visible={showDisputeModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowDisputeModal(false);
            setDisputePrice('');
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
              }}
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
                onChangeText={setDisputePrice}
                autoFocus
                accessibilityLabel="실제 가격 입력"
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowDisputeModal(false);
                    setDisputePrice('');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="취소"
                >
                  <Text style={styles.modalCancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalSubmitButton,
                    (!disputePrice.trim() || isNaN(parseInt(disputePrice, 10))) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleDisputeSubmit}
                  disabled={!disputePrice.trim() || isNaN(parseInt(disputePrice, 10))}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="이의 제기 제출"
                >
                  <Text style={styles.modalSubmitButtonText}>제출</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 공유하기 버튼 */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="공유하기"
        >
          <Text style={styles.shareButtonText}>공유하기</Text>
        </TouchableOpacity>

        {/* 매장 보기 버튼 */}
        <TouchableOpacity
          style={styles.storeButton}
          onPress={handleStorePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="매장 상세 정보 보기"
        >
          <Text style={styles.storeButtonText}>매장 보기</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: spacing.backBtnWidth,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  headerTitle: {
    flex: 1,
    ...typography.headingLg,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  priceImage: {
    width: '100%',
    height: spacing.priceImageHeight,
    backgroundColor: colors.gray100,
  },
  priceImagePlaceholder: {
    width: '100%',
    height: spacing.priceImagePlaceholderHeight,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.bodySm,
    color: colors.gray400,
  },
  priceSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    borderBottomWidth: spacing.dividerThick,
    borderBottomColor: colors.gray100,
  },
  priceText: {
    ...typography.price,
  },
  priceQuantity: {
    ...typography.body,
    color: colors.gray600,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.gray400,
    marginBottom: spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionRowContent: {
    flex: 1,
  },
  avatarCircle: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    borderRadius: spacing.headerIconSize / 2,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.headingMd,
    color: colors.primary,
  },
  sectionValue: {
    ...typography.body,
    color: colors.black,
  },
  sectionSubValue: {
    ...typography.bodySm,
    color: colors.gray600,
    marginTop: spacing.micro,
  },
  storeName: {
    ...typography.headingMd,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  storeAddress: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  trustStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trustStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusFull,
  },
  trustStatusScored: {
    backgroundColor: colors.successLight,
  },
  trustStatusVerifying: {
    backgroundColor: colors.primaryLight,
  },
  trustStatusNew: {
    backgroundColor: colors.gray100,
  },
  trustStatusText: {
    ...typography.captionBold,
  },
  trustStatusTextScored: {
    color: colors.success,
  },
  trustStatusTextVerifying: {
    color: colors.primary,
  },
  trustStatusTextNew: {
    color: colors.gray600,
  },
  staleText: {
    ...typography.caption,
    color: colors.warning,
  },
  trustRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trustBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusFull,
  },
  trustBadgeText: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  trustBadgeDisputed: {
    backgroundColor: colors.dangerLight,
  },
  trustBadgeDisputedText: {
    color: colors.danger,
  },
  shareButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
  },
  shareButtonText: {
    ...typography.headingMd,
    color: colors.gray700,
  },
  storeButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  storeButtonText: {
    ...typography.headingMd,
    color: colors.white,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
  verificationButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  verificationButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  disputeButton: {
    backgroundColor: colors.dangerLight,
    borderWidth: spacing.borderEmphasis,
    borderColor: colors.danger,
  },
  verificationButtonText: {
    ...typography.headingMd,
    color: colors.white,
    fontWeight: '600' as const,
  },
  verificationButtonTextDispute: {
    ...typography.headingMd,
    color: colors.danger,
    fontWeight: '600' as const,
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  verifiedStateContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusMd,
  },
  verifiedStateText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  disputeInput: {
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.modalOverlay,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalHandle: {
    width: spacing.headerIconSize,
    height: spacing.xs,
    borderRadius: spacing.micro,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headingLg,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.bodySm,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.gray100,
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
  },
  modalCancelButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.gray700,
  },
  modalSubmitButton: {
    backgroundColor: colors.danger,
  },
  modalSubmitButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.white,
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  verifiersContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: spacing.borderThin,
    borderTopColor: colors.gray100,
  },
  verifiersTitle: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  verifierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: spacing.borderThin,
    borderBottomColor: colors.gray100,
  },
  verifierItemLast: {
    borderBottomWidth: 0,
  },
  verifierAvatarCircle: {
    width: spacing.backBtnSize,
    height: spacing.backBtnSize,
    borderRadius: spacing.backBtnSize / 2,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifierAvatarText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  verifierInfo: {
    flex: 1,
  },
  verifierName: {
    ...typography.body,
    fontWeight: '500' as const,
    color: colors.black,
  },
  verifierTrust: {
    ...typography.bodySm,
    color: colors.gray600,
    marginTop: spacing.micro,
  },
  verificationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusMd,
  },
  verificationBadgeConfirmed: {
    backgroundColor: colors.primaryLight,
  },
  verificationBadgeDisputed: {
    backgroundColor: colors.dangerLight,
  },
  verificationBadgeText: {
    ...typography.bodySm,
    fontWeight: '600' as const,
  },
  verificationBadgeTextConfirmed: {
    color: colors.primary,
  },
  verificationBadgeTextDisputed: {
    color: colors.danger,
  },
});

export default PriceDetailScreen;
