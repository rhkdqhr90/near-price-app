import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { PriceResponse } from '../../types/api.types';
import { useReactions, useConfirmReaction, useReportReaction } from '../../hooks/queries/useReactions';
import ReportSheet from '../common/ReportSheet';
import ThumbUpIcon from '../icons/ThumbUpIcon';
import MoreIcon from '../icons/MoreIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatPrice, formatRelativeTime } from '../../utils/format';

interface Props {
  rank: number;
  price: PriceResponse;
  onPress: (price: PriceResponse) => void;
}

const PriceRankCard: React.FC<Props> = ({ rank, price, onPress }) => {
  const isTopRank = rank === 1;
  const sheetRef = useRef<BottomSheetModal>(null);
  const { data: reactions } = useReactions(price.id);
  const { mutate: confirm } = useConfirmReaction(price.id);
  const { mutate: report } = useReportReaction(price.id);

  const isConfirmed = reactions?.myReaction === 'confirm';
  const isReported = reactions?.myReaction === 'report';
  const confirmCount = reactions?.confirmCount ?? 0;

  const handleConfirm = useCallback(() => confirm(), [confirm]);
  const handleMore = useCallback(() => {
    if (!isReported) sheetRef.current?.present();
  }, [isReported]);
  const handleReport = useCallback((reason: string) => {
    report(reason, { onSuccess: () => sheetRef.current?.dismiss() });
  }, [report]);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, isTopRank && styles.cardTop]}
        onPress={() => onPress(price)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${rank}위 ${price.store?.name ?? '매장'} ${formatPrice(price.price)}`}
      >
        {/* 순위 배지 */}
        <View style={[styles.rankBadge, isTopRank ? styles.rankBadgeTop : styles.rankBadgeDefault]}>
          <Text style={[styles.rankText, isTopRank && styles.rankTextTop]}>{rank}</Text>
        </View>

        {/* 매장 + 가격 */}
        <View style={styles.info}>
          <Text style={styles.storeName} numberOfLines={1}>{price.store?.name ?? '매장'}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, isTopRank && styles.priceTextTop]}>
              {formatPrice(price.price)}
            </Text>
            <Text style={styles.timeText}>{formatRelativeTime(price.createdAt)}</Text>
          </View>
        </View>

        {/* 맞아요 버튼 */}
        <TouchableOpacity
          style={[styles.confirmBtn, isConfirmed && styles.confirmBtnActive]}
          onPress={handleConfirm}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`맞아요 ${confirmCount}`}
        >
          <ThumbUpIcon size={14} color={isConfirmed ? colors.primary : colors.gray400} filled={isConfirmed} />
          {confirmCount > 0 && (
            <Text style={[styles.confirmCount, isConfirmed && styles.confirmCountActive]}>
              {confirmCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* 더보기 */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={handleMore}
          disabled={isReported}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="더보기"
        >
          <MoreIcon size={16} color={isReported ? colors.danger : colors.gray400} />
        </TouchableOpacity>
      </TouchableOpacity>
      <ReportSheet ref={sheetRef} onReport={handleReport} />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardTop: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: '#FFFAF5',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankBadgeTop: {
    backgroundColor: colors.accent,
  },
  rankBadgeDefault: {
    backgroundColor: colors.gray100,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.gray600,
  },
  rankTextTop: {
    color: colors.white,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  storeName: {
    ...typography.bodySm,
    color: colors.gray600,
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  priceText: {
    ...typography.headingLg,
    fontWeight: '700' as const,
    color: colors.black,
  },
  priceTextTop: {
    color: colors.accent,
  },
  timeText: {
    ...typography.caption,
    color: colors.gray400,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.gray100,
  },
  confirmBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  confirmCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
  confirmCountActive: {
    color: colors.primary,
  },
  moreBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default React.memo(PriceRankCard);
