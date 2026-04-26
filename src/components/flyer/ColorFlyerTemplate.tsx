import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import type { FlyerProductItem, FlyerResponse } from '../../types/api.types';
import { fixImageUrl, formatPrice } from '../../utils/format';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  flyer: FlyerResponse;
  onProductPress: (product: FlyerProductItem) => void;
}

const getDiscountRate = (product: FlyerProductItem): number | null => {
  if (!product.originalPrice || product.originalPrice <= 0) {
    return null;
  }
  return Math.max(0, Math.round((1 - product.salePrice / product.originalPrice) * 100));
};

const ProductVisual: React.FC<{ product: FlyerProductItem; size: number }> = ({ product, size }) => {
  const [hasError, setHasError] = useState(false);
  const uri = fixImageUrl(product.imageUrl);

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: spacing.radiusSm }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallbackImage,
        {
          width: size,
          height: size,
          borderRadius: spacing.radiusSm,
        },
      ]}
    >
      <Text style={styles.fallbackEmoji}>{product.emoji || '🛒'}</Text>
    </View>
  );
};

const ColorFlyerTemplate: React.FC<Props> = ({ flyer, onProductPress }) => {
  const products = useMemo(() => flyer.products ?? [], [flyer.products]);
  const hero = products[0] ?? null;
  const heroDiscountRate = hero ? getDiscountRate(hero) : null;

  const rows = useMemo(() => {
    const list = products.slice(1);
    const chunked: FlyerProductItem[][] = [];
    for (let i = 0; i < list.length; i += 2) {
      chunked.push(list.slice(i, i + 2));
    }
    return chunked;
  }, [products]);

  return (
    <View style={styles.paper}>
      <View style={styles.headerStripe}>
        <Text style={styles.headerEyebrow}>WEEKEND SPECIAL</Text>
        <Text style={styles.headerTitle}>{flyer.storeName}</Text>
        <Text style={styles.headerPeriod}>{flyer.dateRange}</Text>
      </View>

      {hero ? (
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.88}
          onPress={() => onProductPress(hero)}
          accessibilityRole="button"
          accessibilityLabel={`${hero.name} 상세보기`}
        >
          <ProductVisual product={hero} size={124} />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>이번 주 1등 특가</Text>
            <Text style={styles.heroName} numberOfLines={2}>{hero.name}</Text>
            {hero.originalPrice !== null && (
              <Text style={styles.heroOriginalPrice}>{formatPrice(hero.originalPrice)}</Text>
            )}
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>{formatPrice(hero.salePrice).replace('원', '')}</Text>
              <Text style={styles.heroUnit}>원</Text>
            </View>
          </View>
          {heroDiscountRate !== null && (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>SALE</Text>
              <Text style={styles.heroBadgePct}>{heroDiscountRate}%</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>등록된 상품이 없습니다.</Text>
        </View>
      )}

      {rows.map((row, rowIdx) => (
        <View key={`color-row-${rowIdx}`} style={styles.gridRow}>
          {row.map((item) => {
            const itemDiscountRate = getDiscountRate(item);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                onPress={() => onProductPress(item)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} 상세보기`}
              >
                <ProductVisual product={item} size={78} />
                <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.gridPrice}>{formatPrice(item.salePrice)}</Text>
                {itemDiscountRate !== null && (
                  <Text style={styles.gridDiscount}>-{itemDiscountRate}%</Text>
                )}
              </TouchableOpacity>
            );
          })}
          {row.length === 1 && <View style={styles.gridCardPlaceholder} />}
        </View>
      ))}

      <View style={styles.footerCoupon}>
        <Text style={styles.footerCouponTitle}>이 전단지 제시 시 추가 5% 할인</Text>
        <Text style={styles.footerCouponSub}>{flyer.highlight}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#FDF5DD',
    borderWidth: 1.5,
    borderColor: '#2A1F14',
    overflow: 'hidden',
  },
  headerStripe: {
    backgroundColor: '#D03024',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    color: '#FFF8DC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerPeriod: {
    color: '#FDE8C9',
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  heroCard: {
    margin: spacing.md,
    borderWidth: 2,
    borderColor: '#2A1F14',
    backgroundColor: colors.white,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    position: 'relative',
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 10,
    color: '#D03024',
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1F14',
    marginTop: spacing.xs,
    lineHeight: 24,
  },
  heroOriginalPrice: {
    marginTop: spacing.sm,
    color: colors.gray400,
    textDecorationLine: 'line-through',
    fontSize: 12,
    fontWeight: '700',
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 2,
  },
  heroPrice: {
    fontSize: 34,
    color: '#D03024',
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  heroUnit: {
    color: '#D03024',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD500',
    borderWidth: 2,
    borderColor: '#2A1F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2A1F14',
    lineHeight: 10,
  },
  heroBadgePct: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1F14',
    lineHeight: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  gridCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#2A1F14',
    backgroundColor: colors.white,
    padding: spacing.sm,
    alignItems: 'center',
  },
  gridCardPlaceholder: {
    flex: 1,
  },
  gridName: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: '#2A1F14',
    fontSize: 12,
    fontWeight: '800',
    minHeight: 32,
  },
  gridPrice: {
    marginTop: spacing.xs,
    color: '#D03024',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  gridDiscount: {
    color: '#2A1F14',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  footerCoupon: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#2A1F14',
    borderStyle: 'dashed',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFF7C2',
  },
  footerCouponTitle: {
    color: '#2A1F14',
    fontSize: 12,
    fontWeight: '900',
  },
  footerCouponSub: {
    color: '#6A4B2A',
    fontSize: 11,
    marginTop: spacing.xs,
    fontWeight: '700',
  },
  fallbackImage: {
    backgroundColor: '#EFE5CB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBBE9E',
  },
  fallbackEmoji: {
    fontSize: 34,
  },
  emptyBox: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray600,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ColorFlyerTemplate;
