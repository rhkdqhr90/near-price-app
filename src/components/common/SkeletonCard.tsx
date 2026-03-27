import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  variant?: 'price' | 'wishlist' | 'rank';
  count?: number;
}

const VARIANTS = {
  price: {
    count: 5,
    cardHeight: 72,
    colorBarWidth: 3,
    colorBarMarginV: 12,
  },
  wishlist: {
    count: 5,
    cardHeight: 70,
    colorBarWidth: 3,
    colorBarHeight: 46,
  },
  rank: {
    count: 4,
    cardHeight: 68,
    rankSize: 28,
  },
};

const SkeletonCard: React.FC<Props> = ({ variant = 'price', count: countOverride }) => {
  const config = VARIANTS[variant];
  const itemCount = countOverride ?? config.count;

  if (variant === 'price') {
    return (
      <View style={styles.container}>
        {Array.from({ length: itemCount }, (_, i) => (
          <View key={i} style={[styles.card, { height: config.cardHeight }]}>
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
  }

  if (variant === 'wishlist') {
    return (
      <View style={styles.container}>
        {Array.from({ length: itemCount }, (_, i) => (
          <View key={i} style={[styles.card, { height: config.cardHeight }]}>
            <SkeletonBox style={styles.colorBar} />
            <View style={styles.wishlistBody}>
              <SkeletonBox style={styles.wishlistTitleLine} />
              <SkeletonBox style={styles.wishlistPriceLine} />
            </View>
            <SkeletonBox style={styles.deleteArea} />
          </View>
        ))}
      </View>
    );
  }

  // rank variant
  return (
    <View style={styles.container}>
      {Array.from({ length: itemCount }, (_, i) => (
        <View key={i} style={[styles.card, { height: config.cardHeight }]}>
          <SkeletonBox style={styles.rank} />
          <View style={styles.rankBody}>
            <SkeletonBox style={styles.storeLine} />
            <SkeletonBox style={styles.metaLine} />
          </View>
          <SkeletonBox style={styles.rankPriceLine} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
  },
  colorBar: {
    width: 3,
    marginVertical: spacing.md,
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
  // Wishlist variants
  wishlistBody: {
    flex: 1,
    paddingLeft: spacing.md,
    gap: spacing.cardTextGap + spacing.xs,
  },
  wishlistTitleLine: {
    width: 130,
    height: 14,
    borderRadius: spacing.radiusSm,
  },
  wishlistPriceLine: {
    width: 80,
    height: 12,
    borderRadius: spacing.radiusSm,
  },
  deleteArea: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.lg,
  },
  // Rank variants
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rankBody: {
    flex: 1,
    paddingLeft: spacing.lg,
    gap: spacing.sm,
  },
  storeLine: {
    width: 100,
    height: 14,
    borderRadius: spacing.radiusSm,
  },
  rankPriceLine: {
    width: 60,
    height: 16,
    borderRadius: spacing.sm,
  },
});

export default SkeletonCard;
