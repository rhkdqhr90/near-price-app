import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import type { FlyerProductItem, FlyerResponse } from '../../types/api.types';
import { fixImageUrl, formatPrice } from '../../utils/format';
import { spacing } from '../../theme/spacing';

interface Props {
  flyer: FlyerResponse;
  onProductPress: (product: FlyerProductItem) => void;
}

const rate = (item: FlyerProductItem): number | null => {
  if (!item.originalPrice || item.originalPrice <= 0) {
    return null;
  }
  return Math.max(0, Math.round((1 - item.salePrice / item.originalPrice) * 100));
};

const RisoVisual: React.FC<{ item: FlyerProductItem; size: number }> = ({ item, size }) => {
  const [errored, setErrored] = useState(false);
  const uri = fixImageUrl(item.imageUrl);

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 2 }}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <View
      style={[styles.visualFallback, { width: size, height: size }]}
    >
      <Text style={styles.visualEmoji}>{item.emoji || '🛒'}</Text>
    </View>
  );
};

const RisoFlyerTemplate: React.FC<Props> = ({ flyer, onProductPress }) => {
  const products = useMemo(() => flyer.products ?? [], [flyer.products]);
  const hero = products[0] ?? null;

  const rows = useMemo(() => {
    const remain = products.slice(1);
    const grouped: FlyerProductItem[][] = [];
    for (let i = 0; i < remain.length; i += 2) {
      grouped.push(remain.slice(i, i + 2));
    }
    return grouped;
  }, [products]);

  return (
    <View style={styles.paper}>
      <View style={styles.bgCirclePink} />
      <View style={styles.bgCircleTeal} />

      <View style={styles.inner}>
        <Text style={styles.eyebrow}>SUPER SAVER FLYER</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{`왕창\n할인!`}</Text>
          <View style={styles.titleMeta}>
            <Text style={styles.storeName}>{flyer.storeName}</Text>
            <Text style={styles.period}>{flyer.dateRange}</Text>
          </View>
        </View>

        {hero ? (
          <TouchableOpacity
            style={styles.heroCard}
            onPress={() => onProductPress(hero)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${hero.name} 상세보기`}
          >
            <View style={styles.heroImageWrap}>
              <RisoVisual item={hero} size={108} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTag}>BEST PICK</Text>
              <Text style={styles.heroName} numberOfLines={2}>{hero.name}</Text>
              {hero.originalPrice !== null && (
                <Text style={styles.heroOriginal}>{formatPrice(hero.originalPrice)}</Text>
              )}
              <Text style={styles.heroPrice}>{formatPrice(hero.salePrice)}</Text>
              {rate(hero) !== null && (
                <Text style={styles.heroDiscount}>{rate(hero)}% OFF</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null}

        {rows.map((row, idx) => (
          <View key={`riso-row-${idx}`} style={styles.gridRow}>
            {row.map((item, itemIdx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gridCard,
                  itemIdx === 0 ? styles.gridCardTeal : styles.gridCardPink,
                ]}
                onPress={() => onProductPress(item)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} 상세보기`}
              >
                <RisoVisual item={item} size={72} />
                <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.gridPrice}>{formatPrice(item.salePrice)}</Text>
                {rate(item) !== null && (
                  <Text style={styles.gridDiscount}>-{rate(item)}%</Text>
                )}
              </TouchableOpacity>
            ))}
            {row.length === 1 && <View style={styles.gridCardPlaceholder} />}
          </View>
        ))}

        <View style={styles.footerStrip}>
          <Text style={styles.footerText}>★ {flyer.highlight || flyer.promotionTitle} ★</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#F5EFE0',
    borderWidth: 1.5,
    borderColor: '#1A1818',
    overflow: 'hidden',
    position: 'relative',
  },
  bgCirclePink: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF4F8B',
    opacity: 0.28,
    top: -30,
    right: -40,
  },
  bgCircleTeal: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#0EA5C7',
    opacity: 0.26,
    bottom: 30,
    left: -50,
  },
  inner: {
    padding: spacing.md,
  },
  eyebrow: {
    color: '#0EA5C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  titleRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    color: '#1A1818',
    fontSize: 42,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -2,
    textShadowColor: '#FF4F8B',
    textShadowRadius: 0,
    textShadowOffset: { width: 2, height: 2 },
  },
  titleMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  storeName: {
    color: '#1A1818',
    fontSize: 13,
    fontWeight: '900',
    maxWidth: 120,
    textAlign: 'right',
  },
  period: {
    color: '#F5EFE0',
    backgroundColor: '#1A1818',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  heroCard: {
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: '#1A1818',
    backgroundColor: '#FFF9EE',
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 4,
  },
  heroImageWrap: {
    width: 108,
    height: 108,
    borderWidth: 1,
    borderColor: '#1A1818',
    backgroundColor: '#0EA5C7',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTag: {
    color: '#FF4F8B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroName: {
    color: '#1A1818',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  heroOriginal: {
    marginTop: spacing.sm,
    color: '#716A5F',
    textDecorationLine: 'line-through',
    fontWeight: '700',
    fontSize: 12,
  },
  heroPrice: {
    color: '#1A1818',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 1,
    textShadowColor: '#0EA5C7',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
  },
  heroDiscount: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#1A1818',
    backgroundColor: '#FF4F8B',
    color: '#FFF9EE',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  gridRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1A1818',
    padding: spacing.sm,
  },
  gridCardTeal: {
    backgroundColor: 'rgba(14,165,199,0.16)',
  },
  gridCardPink: {
    backgroundColor: 'rgba(255,79,139,0.14)',
  },
  gridCardPlaceholder: {
    flex: 1,
  },
  gridName: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: '#1A1818',
    minHeight: 32,
  },
  gridPrice: {
    marginTop: spacing.xs,
    color: '#1A1818',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  gridDiscount: {
    marginTop: 1,
    color: '#FF4F8B',
    fontSize: 11,
    fontWeight: '900',
  },
  footerStrip: {
    marginTop: spacing.md,
    backgroundColor: '#1A1818',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    color: '#F5EFE0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  visualFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EFE0',
  },
  visualEmoji: {
    fontSize: 34,
  },
});

export default RisoFlyerTemplate;
