import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackActions } from '@react-navigation/native';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatPrice } from '../../utils/format';
import CheckIcon from '../../components/icons/CheckIcon';

type Props = PriceRegisterScreenProps<'Done'>;

/**
 * 레퍼런스: 마실 2/screens-register.jsx `RegisterDone`
 * - 88×88 primary 원 + 체크마크 SVG
 * - "등록 완료!" 타이틀
 * - 서브텍스트: `{상품명} · {가격}` + 감사 문구
 * - 포인트 pill (+N 포인트)
 * - 홈으로 Primary 버튼
 */
const RegisterDoneScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { itemCount, firstItemName, firstItemPrice } = route.params;

  const summaryText = useMemo(() => {
    if (!firstItemName || firstItemPrice == null) {
      return `${itemCount}개 품목 등록이 완료됐어요.`;
    }
    const extra = itemCount > 1 ? ` 외 ${itemCount - 1}개` : '';
    return `${firstItemName}${extra} · ${formatPrice(firstItemPrice)}`;
  }, [firstItemName, firstItemPrice, itemCount]);

  const points = itemCount * 12;

  const handleGoHome = useCallback(() => {
    navigation.dispatch(StackActions.popToTop());
    navigation.getParent()?.navigate('HomeStack' as never);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CheckIcon size={44} color={colors.onPrimary} />
        </View>

        <Text style={styles.title}>등록 완료!</Text>
        <Text style={styles.subtitle}>{summaryText}</Text>
        <Text style={styles.thanks}>이웃에게 큰 도움이 될 거예요 🙏</Text>

        <View style={styles.pointPill}>
          <Text style={styles.pointPillText}>{`+${points} 포인트`}</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          onPress={handleGoHome}
          style={styles.homeButton}
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
        >
          <Text style={styles.homeButtonText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // 레퍼런스: boxShadow '0 10px 30px rgba(0,191,165,0.35)'
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: spacing.elevationLg,
  },
  title: {
    ...typography.headingXl,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
  },
  thanks: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  pointPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primaryLight,
  },
  pointPillText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: spacing.borderThin,
    borderTopColor: colors.surfaceContainer,
  },
  homeButton: {
    height: spacing.buttonHeight,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  homeButtonText: {
    ...typography.headingMd,
    color: colors.onPrimary,
  },
});

export default RegisterDoneScreen;
