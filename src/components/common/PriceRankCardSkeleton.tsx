import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const CARD_COUNT = 4;
const CARD_HEIGHT = 68;
const RANK_SIZE = 28;

const PriceRankCardSkeleton: React.FC = () => (
  <View style={styles.container}>
    {Array.from({ length: CARD_COUNT }, (_, i) => (
      <View key={i} style={styles.card}>
        <SkeletonBox style={styles.rank} />
        <View style={styles.body}>
          <SkeletonBox style={styles.storeLine} />
          <SkeletonBox style={styles.metaLine} />
        </View>
        <SkeletonBox style={styles.priceLine} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.cardGap,
    gap: spacing.md,
    height: CARD_HEIGHT,
  },
  rank: {
    width: RANK_SIZE,
    height: RANK_SIZE,
    borderRadius: RANK_SIZE / 2,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  storeLine: {
    width: 100,
    height: 14,
    borderRadius: 7,
  },
  metaLine: {
    width: 140,
    height: 11,
    borderRadius: 5.5,
  },
  priceLine: {
    width: 60,
    height: 16,
    borderRadius: 8,
  },
});

export default PriceRankCardSkeleton;
