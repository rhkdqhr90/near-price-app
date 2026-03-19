import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PriceResponse } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatPrice, formatRelativeTime } from '../../utils/format';

interface Props {
  rank: number;
  price: PriceResponse;
  onPress: (storeId: string) => void;
}

const PriceRankCard: React.FC<Props> = ({ rank, price, onPress }) => {
  const isTopRank = rank === 1;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(price.store.id)} activeOpacity={0.7}>
      <View style={[styles.rankBadge, isTopRank ? styles.rankBadgePrimary : styles.rankBadgeDefault]}>
        <Text style={[styles.rankText, isTopRank ? styles.rankTextPrimary : styles.rankTextDefault]}>
          {rank}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.priceText}>{formatPrice(price.price)}</Text>
        <Text style={styles.storeName}>{price.store.name}</Text>
        {price.condition ? (
          <Text style={styles.condition}>{price.condition}</Text>
        ) : null}
      </View>
      <Text style={styles.timeText}>{formatRelativeTime(price.createdAt)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  rankBadgePrimary: {
    backgroundColor: colors.primary,
  },
  rankBadgeDefault: {
    backgroundColor: colors.gray200,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  rankTextPrimary: {
    color: colors.white,
  },
  rankTextDefault: {
    color: colors.gray600,
  },
  content: {
    flex: 1,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.black,
  },
  storeName: {
    ...typography.tagText,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  condition: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  timeText: {
    ...typography.caption,
  },
});

export default React.memo(PriceRankCard);
