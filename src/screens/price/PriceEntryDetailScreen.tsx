import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, PJS } from '../../theme/typography';
import { formatRelativeTime } from '../../utils/format';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import { usePriceDetail } from '../../hooks/queries/usePrices';
import { useVerifyPrice, useMyVerificationByPrice } from '../../hooks/queries/useVerification';
import { useReportReaction, useReactions } from '../../hooks/queries/useReactions';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { STORE_TYPE_LABELS } from '../../utils/constants';

type Props = HomeScreenProps<'PriceEntryDetail'>;

/**
 * 개별 가격 엔트리 상세 화면.
 *
 * 진입: StoreHistorySheet의 HistoryRow 탭 → priceId 전달.
 * 기능(MVP):
 *   - 가격/매장/제보자 정보 표시
 *   - 맞아요 / 달라요 (단일 토글 — 달라요는 actualPrice 없이 제출)
 *   - 신고 (자유 텍스트 reason 입력)
 *
 * 본인 등록 가격은 반응 버튼 숨김(서버 정책과 동일).
 * 이미 검증/신고한 경우 disabled 처리.
 */
const PriceEntryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { priceId } = route.params;
  const insets = useSafeAreaInsets();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const showToast = useToastStore((s) => s.showToast);

  const { data: price, isLoading, isError, refetch } = usePriceDetail(priceId);
  const { data: myVerification } = useMyVerificationByPrice(priceId);
  const { mutate: verifyPrice, isPending: isVerifying } = useVerifyPrice(priceId);
  const { data: reactions } = useReactions(priceId);
  const { mutate: reportReaction, isPending: isReporting } = useReportReaction(priceId);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);

  const isOwnPrice = !!currentUserId && price?.user?.id === currentUserId;
  const hasVerified = !!myVerification;
  const hasReported = reactions?.myReaction === 'report';

  const handleConfirm = useCallback(() => {
    if (isOwnPrice) {
      showToast('본인이 등록한 가격은 검증할 수 없어요', 'error');
      return;
    }
    if (hasVerified) {
      showToast('이미 검증에 참여했어요', 'error');
      return;
    }
    verifyPrice(
      { result: 'confirmed' },
      {
        onSuccess: () => {
          Vibration.vibrate(30);
          showToast('가격을 확인했어요!', 'success');
        },
        onError: () => {
          showToast('가격 확인 처리에 실패했어요', 'error');
        },
      },
    );
  }, [verifyPrice, showToast, isOwnPrice, hasVerified]);

  const handleDispute = useCallback(() => {
    if (isOwnPrice) {
      showToast('본인이 등록한 가격은 검증할 수 없어요', 'error');
      return;
    }
    if (hasVerified) {
      showToast('이미 검증에 참여했어요', 'error');
      return;
    }
    verifyPrice(
      { result: 'disputed' },
      {
        onSuccess: () => {
          Vibration.vibrate(30);
          showToast('가격이 다르다고 알렸어요', 'success');
        },
        onError: () => {
          showToast('이의 제기에 실패했어요', 'error');
        },
      },
    );
  }, [verifyPrice, showToast, isOwnPrice, hasVerified]);

  const handleOpenReport = useCallback(() => {
    if (isOwnPrice) {
      showToast('본인이 등록한 가격은 신고할 수 없어요', 'error');
      return;
    }
    if (hasReported) {
      showToast('이미 신고 접수했어요', 'error');
      return;
    }
    setReportReason('');
    setReportError(null);
    setShowReportModal(true);
  }, [isOwnPrice, hasReported, showToast]);

  const handleSubmitReport = useCallback(() => {
    const trimmed = reportReason.trim();
    if (trimmed.length < 5) {
      setReportError('신고 사유를 5자 이상 입력해 주세요');
      return;
    }
    if (trimmed.length > 200) {
      setReportError('신고 사유는 200자 이하로 입력해 주세요');
      return;
    }
    setReportError(null);
    reportReaction(trimmed, {
      onSuccess: () => {
        setShowReportModal(false);
        setReportReason('');
        showToast('신고가 접수되었어요', 'success');
      },
      onError: () => {
        setReportError('신고 처리에 실패했어요. 다시 시도해 주세요.');
      },
    });
  }, [reportReason, reportReaction, showToast]);

  // ─── Loading / Error ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header onBack={() => navigation.goBack()} topPadding={0} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (isError || !price) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header onBack={() => navigation.goBack()} topPadding={0} />
        <View style={styles.center}>
          <Text style={styles.errorText}>가격 정보를 불러오지 못했어요.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const storeTypeLabel = STORE_TYPE_LABELS[price.store.type] ?? price.store.type;
  const reporterNickname = price.user?.nickname ?? '익명';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        onBack={() => navigation.goBack()}
        topPadding={insets.top + spacing.sm}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 가격 카드 ──────────────────────────────────────────────────── */}
        <View style={styles.priceCard}>
          <Text style={styles.productName} numberOfLines={2}>
            {price.product.name}
          </Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceValue}>
              {price.price.toLocaleString('ko-KR')}
            </Text>
            <Text style={styles.priceUnit}>원</Text>
          </View>
          <Text style={styles.priceMeta}>
            {formatRelativeTime(price.createdAt)} 등록
          </Text>
        </View>

        {/* ─── 매장 정보 ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>매장</Text>
          <View style={styles.storeRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {price.store.name}
            </Text>
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>{storeTypeLabel}</Text>
            </View>
          </View>
          {price.store.address ? (
            <Text style={styles.storeAddress} numberOfLines={2}>
              {price.store.address}
            </Text>
          ) : null}
        </View>

        {/* ─── 제보자 정보 ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>제보자</Text>
          <View style={styles.reporterRow}>
            <Text style={styles.reporterName}>@{reporterNickname}</Text>
            {price.trustScore != null ? (
              <Text style={styles.reporterTrust}>
                신뢰점수 {price.trustScore}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ─── 반응 버튼 ─────────────────────────────────────────────────── */}
        {!isOwnPrice && currentUserId ? (
          <View style={styles.verifyRow}>
            <TouchableOpacity
              style={[styles.verifyBtn, styles.confirmBtn, hasVerified && styles.verifyBtnDisabled]}
              onPress={handleConfirm}
              disabled={hasVerified || isVerifying}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="가격이 맞아요"
            >
              <Text style={styles.confirmBtnText}>
                맞아요 ✓ {price.confirmedCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.verifyBtn, styles.disputeBtn, hasVerified && styles.verifyBtnDisabled]}
              onPress={handleDispute}
              disabled={hasVerified || isVerifying}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="가격이 달라요"
            >
              <Text style={styles.disputeBtnText}>
                달라요 ✗ {price.disputedCount}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isOwnPrice ? (
          <View style={styles.ownNotice}>
            <Text style={styles.ownNoticeText}>본인이 등록한 가격이에요</Text>
          </View>
        ) : null}

        {/* ─── 신고 버튼 ─────────────────────────────────────────────────── */}
        {!isOwnPrice && currentUserId ? (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={handleOpenReport}
            disabled={hasReported || isReporting}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="이 가격 신고하기"
          >
            <Text
              style={[
                styles.reportBtnText,
                hasReported && styles.reportBtnTextDisabled,
              ]}
            >
              {hasReported ? '신고 접수됨' : '🚩 이 가격 신고하기'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* ─── 신고 Modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowReportModal(false)}
            accessibilityRole="button"
            accessibilityLabel="모달 닫기"
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>신고 사유</Text>
            <Text style={styles.modalSubtitle}>
              허위 정보, 욕설/혐오 표현, 광고성 등 사유를 간단히 적어 주세요.
            </Text>
            <TextInput
              style={styles.reportInput}
              placeholder="예: 해당 가격표가 실제와 전혀 달라요"
              placeholderTextColor={colors.gray400}
              value={reportReason}
              onChangeText={(v) => {
                setReportReason(v);
                if (reportError) setReportError(null);
              }}
              multiline
              maxLength={200}
              autoFocus
              accessibilityLabel="신고 사유 입력"
            />
            {reportError ? (
              <Text style={styles.reportErrorText}>{reportError}</Text>
            ) : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowReportModal(false)}
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
                  (isReporting || reportReason.trim().length < 5) &&
                    styles.modalBtnDisabled,
                ]}
                onPress={handleSubmitReport}
                disabled={isReporting || reportReason.trim().length < 5}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="신고 제출"
              >
                {isReporting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>신고</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── 헤더 서브컴포넌트 ─────────────────────────────────────────────────────
const Header: React.FC<{ onBack: () => void; topPadding: number }> = ({
  onBack,
  topPadding,
}) => (
  <View style={[styles.header, { paddingTop: topPadding }]}>
    <TouchableOpacity
      style={styles.headerIconBtn}
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
    >
      <ChevronLeftIcon size={spacing.iconLg} color={colors.onBackground} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>가격 상세</Text>
    <View style={styles.headerIconBtn} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: spacing.borderHairline,
    borderBottomColor: colors.outlineVariant,
  },
  headerIconBtn: {
    width: spacing.headerIconSize,
    height: spacing.headerIconSize,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: PJS.extraBold,
    fontSize: 15,
    color: colors.onBackground,
    textAlign: 'center',
  },

  // ─── Scroll ──────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontFamily: PJS.bold,
    fontSize: 13,
    color: colors.white,
  },

  // ─── Price Card ──────────────────────────────────────────────────────────
  priceCard: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusInput,
    borderWidth: spacing.borderThin,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
  },
  productName: {
    fontFamily: PJS.bold,
    fontSize: 15,
    color: colors.onBackground,
    letterSpacing: -0.2,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  priceValue: {
    fontFamily: PJS.extraBold,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  priceUnit: {
    fontFamily: PJS.bold,
    fontSize: 16,
    color: colors.primary,
  },
  priceMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },

  // ─── Card ────────────────────────────────────────────────────────────────
  card: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusInput,
    borderWidth: spacing.borderThin,
    borderColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeName: {
    flex: 1,
    fontFamily: PJS.bold,
    fontSize: 14,
    color: colors.onBackground,
  },
  storeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  storeBadgeText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  storeAddress: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reporterName: {
    fontFamily: PJS.semiBold,
    fontSize: 13,
    color: colors.onBackground,
  },
  reporterTrust: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },

  // ─── Verify ──────────────────────────────────────────────────────────────
  verifyRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  verifyBtn: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: spacing.disabledOpacity,
  },
  confirmBtn: {
    backgroundColor: colors.successContainer,
  },
  confirmBtnText: {
    fontFamily: PJS.bold,
    fontSize: 14,
    color: colors.onSuccessContainer,
  },
  disputeBtn: {
    backgroundColor: colors.errorContainer,
  },
  disputeBtnText: {
    fontFamily: PJS.bold,
    fontSize: 14,
    color: colors.onErrorContainer,
  },
  ownNotice: {
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
  },
  ownNoticeText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },

  // ─── Report ──────────────────────────────────────────────────────────────
  reportBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtnText: {
    fontFamily: PJS.semiBold,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  reportBtnTextDisabled: {
    color: colors.gray400,
  },

  // ─── Modal ───────────────────────────────────────────────────────────────
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
  reportInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 88,
    textAlignVertical: 'top',
    ...typography.body,
    marginBottom: spacing.sm,
  },
  reportErrorText: {
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
    backgroundColor: colors.danger,
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

export default PriceEntryDetailScreen;
