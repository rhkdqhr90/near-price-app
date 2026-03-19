import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const CARD_COUNT = 5;
const CARD_HEIGHT = 70;
const COLOR_BAR_WIDTH = 3;
const COLOR_BAR_HEIGHT = 46;
const DELETE_ICON_SIZE = 20;
// spacing.cardTextGap(6) + spacing.xs(4) = 10
const BODY_GAP = spacing.cardTextGap + spacing.xs;

const WishlistCardSkeleton: React.FC = () => (
  <View style={styles.container}>
    {Array.from({ length: CARD_COUNT }, (_, i) => (
      <View key={i} style={styles.card}>
        <SkeletonBox style={styles.colorBar} />
        <View style={styles.body}>
          <SkeletonBox style={styles.titleLine} />
          <SkeletonBox style={styles.priceLine} />
        </View>
        <SkeletonBox style={styles.deleteArea} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
    height: CARD_HEIGHT,
  },
  colorBar: {
    width: COLOR_BAR_WIDTH,
    height: COLOR_BAR_HEIGHT,
    marginLeft: spacing.inputPad,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    paddingLeft: spacing.md,
    gap: BODY_GAP,
  },
  titleLine: {
    width: 130,
    height: 14,
    borderRadius: 7,
  },
  priceLine: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  deleteArea: {
    width: DELETE_ICON_SIZE,
    height: DELETE_ICON_SIZE,
    borderRadius: DELETE_ICON_SIZE / 2,
    marginRight: spacing.lg,
  },
});

export default WishlistCardSkeleton;
