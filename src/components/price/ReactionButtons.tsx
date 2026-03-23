import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useReactions, useConfirmReaction, useReportReaction } from '../../hooks/queries/useReactions';
import ReportSheet from '../common/ReportSheet';
import CheckIcon from '../icons/CheckIcon';
import MoreIcon from '../icons/MoreIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  priceId: string;
}

const ReactionButtons: React.FC<Props> = ({ priceId }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { data: reactions } = useReactions(priceId);
  const { mutate: confirm } = useConfirmReaction(priceId);
  const { mutate: report } = useReportReaction(priceId);

  const isConfirmed = reactions?.myReaction === 'confirm';
  const isReported = reactions?.myReaction === 'report';
  const confirmCount = reactions?.confirmCount ?? 0;

  const handleConfirmPress = useCallback(() => {
    confirm();
  }, [confirm]);

  const handleMorePress = useCallback(() => {
    if (isReported) {
      return;
    }
    sheetRef.current?.present();
  }, [isReported]);

  const handleReport = useCallback(
    (reason: string) => {
      report(reason, {
        onSuccess: () => {
          sheetRef.current?.dismiss();
        },
      });
    },
    [report],
  );

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`맞아요${confirmCount > 0 ? ` ${confirmCount}명` : ''}`}
          accessibilityState={{ checked: isConfirmed }}
        >
          <CheckIcon
            size={spacing.iconSm}
            color={isConfirmed ? colors.primary : colors.tabIconInactive}
            filled={isConfirmed}
          />
          <Text style={[styles.confirmText, isConfirmed && styles.confirmTextActive]}>
            맞아요{confirmCount > 0 ? ` ${confirmCount}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMorePress}
          activeOpacity={0.7}
          disabled={isReported}
          accessibilityRole="button"
          accessibilityLabel="더보기"
          accessibilityState={{ disabled: isReported }}
        >
          <MoreIcon
            size={spacing.iconSm}
            color={isReported ? colors.danger : colors.gray600}
          />
        </TouchableOpacity>
      </View>
      <ReportSheet ref={sheetRef} onReport={handleReport} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  confirmText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  confirmTextActive: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  moreButton: {
    padding: spacing.xs,
  },
});

export default React.memo(ReactionButtons);
