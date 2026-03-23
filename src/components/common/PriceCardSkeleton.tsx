import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const CARD_COUNT = 5;
const CARD_HEIGHT = 72;
const COLOR_BAR_WIDTH = 3;
const COLOR_BAR_MARGIN_V = 12;

const PriceCardSkeleton: React.FC = () => (
  <View style={styles.container}>
    {Array.from({ length: CARD_COUNT }, (_, i) => (
      <View key={i} style={styles.card}>
        <SkeletonBox style={styles.colorBar} />
        <View style={styles.body}>
          <View style={styles.left}>
            <SkeletonBox style={styles.titleLine} />
            <SkeletonBox style={styles.metaLine} />
          </View>
          <View style={styles.right}>
            <SkeletonBox style={styles.priceLine} />
            <SkeletonBox style={styles.compareLine} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.headerContent,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
    height: CARD_HEIGHT,
  },
  colorBar: {
    width: COLOR_BAR_WIDTH,
    marginVertical: COLOR_BAR_MARGIN_V,
    marginLeft: spacing.inputPad,
    borderRadius: spacing.micro,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.xl,
  },
  left: {
    flex: 1,
    gap: spacing.sm,
  },
  titleLine: {
    width: 120,
    height: 14,
    borderRadius: spacing.radiusSm,
  },
  metaLine: {
    width: 160,
    height: 11,
    borderRadius: spacing.radiusSm,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.cardTextGap,
  },
  priceLine: {
    width: 64,
    height: 16,
    borderRadius: spacing.sm,
  },
  compareLine: {
    width: 44,
    height: 11,
    borderRadius: spacing.radiusSm,
  },
});

export default PriceCardSkeleton;
