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

  const handlePress = useCallback(() => onPress(price), [onPress, price]);
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
        onPress={handlePress}
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
          {price.trustScore != null && (
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>✓ {Math.round(price.trustScore)}%</Text>
            </View>
          )}
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
          <ThumbUpIcon size={spacing.iconXs} color={isConfirmed ? colors.primary : colors.gray400} filled={isConfirmed} />
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
          <MoreIcon size={spacing.iconSm} color={isReported ? colors.danger : colors.gray400} />
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
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
  },
  cardTop: {
    borderColor: colors.accent,
    borderWidth: spacing.borderMedium,
    backgroundColor: colors.accentSurface,
  },
  rankBadge: {
    width: spacing.rankBadgeSize,
    height: spacing.rankBadgeSize,
    borderRadius: spacing.rankBadgeSize / 2,
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
    ...typography.bodySm,
    fontWeight: '700' as const,
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
    marginBottom: spacing.micro,
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
    gap: spacing.micro,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.gray100,
  },
  confirmBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  confirmCount: {
    ...typography.caption,
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
  trustBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.micro,
    marginTop: spacing.micro,
  },
  trustBadgeText: {
    ...typography.captionBold,
    color: colors.success,
  },
});

export default React.memo(PriceRankCard);
