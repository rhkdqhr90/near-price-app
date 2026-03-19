import React, { forwardRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const REPORT_REASONS = ['가격 틀림', '매장 틀림', '허위 정보', '기타'] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

interface Props {
  onReport: (reason: string) => void;
}

const ReportSheet = forwardRef<BottomSheetModal, Props>(({ onReport }, ref) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);

  const handleConfirm = useCallback(() => {
    if (!selectedReason) {
      return;
    }
    onReport(selectedReason);
    setSelectedReason(null);
  }, [selectedReason, onReport]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['50%']}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onDismiss={() => setSelectedReason(null)}
    >
      <View style={styles.container}>
        <Text style={styles.title}>신고 사유를 선택해 주세요</Text>
        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[styles.reasonRow, selectedReason === reason && styles.reasonRowSelected]}
            onPress={() => setSelectedReason(reason)}
            activeOpacity={0.7}
          >
            <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
              {reason}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedReason && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedReason}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>신고하기</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
});

ReportSheet.displayName = 'ReportSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.headingMd,
    marginBottom: spacing.lg,
  },
  reasonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.gray100,
  },
  reasonRowSelected: {
    backgroundColor: colors.primaryLight,
  },
  reasonText: {
    ...typography.bodyMd,
    color: colors.gray700,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  confirmButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    paddingVertical: spacing.inputPad,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  confirmButtonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default ReportSheet;
