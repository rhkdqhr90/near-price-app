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

const discount = (item: FlyerProductItem): number | null => {
  if (!item.originalPrice || item.originalPrice <= 0) {
    return null;
  }
  return Math.max(0, Math.round((1 - item.salePrice / item.originalPrice) * 100));
};

const PosterImage: React.FC<{ item: FlyerProductItem; size: number }> = ({ item, size }) => {
  const [failed, setFailed] = useState(false);
  const uri = fixImageUrl(item.imageUrl);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: spacing.radiusSm }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[styles.posterFallback, { width: size, height: size }]}
    >
      <Text style={styles.posterFallbackEmoji}>{item.emoji || '🛒'}</Text>
    </View>
  );
};

const PosterFlyerTemplate: React.FC<Props> = ({ flyer, onProductPress }) => {
  const products = useMemo(() => flyer.products ?? [], [flyer.products]);
  const hero = products[0] ?? null;
  const second = products[1] ?? null;
  const remain = products.slice(2);

  return (
    <View style={styles.paper}>
      <View style={styles.tapeLeft} />
      <View style={styles.tapeRight} />

      <View style={styles.header}>
        <Text style={styles.headerTop}>♥ 오늘의 ♥</Text>
        <Text style={styles.headerTitle}>막장세일</Text>
        <Text style={styles.headerSub}>{flyer.storeName} · {flyer.dateRange}</Text>
      </View>

      {hero ? (
        <TouchableOpacity
          style={styles.heroSection}
          onPress={() => onProductPress(hero)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${hero.name} 상세보기`}
        >
          <Text style={styles.heroArrow}>↓ 이 가격 실화? ↓</Text>
          <Text style={styles.heroName}>{hero.name}</Text>
          <View style={styles.heroPriceBlock}>
            {hero.originalPrice !== null && (
              <Text style={styles.heroOriginal}>{formatPrice(hero.originalPrice)}</Text>
            )}
            <Text style={styles.heroPriceNum}>{formatPrice(hero.salePrice).replace('원', '')}</Text>
            <Text style={styles.heroPriceUnit}>원</Text>
          </View>
          {discount(hero) !== null && (
            <Text style={styles.heroSaleTag}>SALE {discount(hero)}% OFF</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {second ? (
        <TouchableOpacity
          style={styles.secondSection}
          onPress={() => onProductPress(second)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${second.name} 상세보기`}
        >
          <PosterImage item={second} size={72} />
          <View style={styles.secondTextWrap}>
            <Text style={styles.secondLabel}>NO.2</Text>
            <Text style={styles.secondName} numberOfLines={2}>{second.name}</Text>
            <Text style={styles.secondPrice}>{formatPrice(second.salePrice)}</Text>
          </View>
          {discount(second) !== null && (
            <Text style={styles.secondDiscount}>▼{discount(second)}%</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {remain.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>─ 그 외 가격표 ─</Text>
          <View style={styles.listGrid}>
            {remain.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.noteCard,
                  idx % 3 === 0 ? styles.noteYellow : idx % 3 === 1 ? styles.notePink : styles.noteBlue,
                ]}
                onPress={() => onProductPress(item)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} 상세보기`}
              >
                <View style={styles.noteTopRow}>
                  <PosterImage item={item} size={34} />
                  <Text style={styles.noteName} numberOfLines={2}>{item.name}</Text>
                </View>
                <Text style={styles.notePrice}>{formatPrice(item.salePrice)}</Text>
                {discount(item) !== null && (
                  <Text style={styles.noteDiscount}>-{discount(item)}%</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>📍 {flyer.highlight || flyer.promotionTitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#F0E5C8',
    borderWidth: 2,
    borderColor: '#1A1512',
    position: 'relative',
    overflow: 'hidden',
  },
  tapeLeft: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 64,
    height: 20,
    backgroundColor: 'rgba(255,235,150,0.65)',
    transform: [{ rotate: '-8deg' }],
    zIndex: 2,
  },
  tapeRight: {
    position: 'absolute',
    top: 0,
    right: 22,
    width: 52,
    height: 20,
    backgroundColor: 'rgba(255,235,150,0.65)',
    transform: [{ rotate: '8deg' }],
    zIndex: 2,
  },
  header: {
    marginTop: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: '#1A1512',
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  headerTop: {
    color: '#D03024',
    fontSize: 20,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#1A1512',
    fontSize: 54,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -3,
    textShadowColor: '#D03024',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  headerSub: {
    marginTop: spacing.xs,
    color: '#3A3028',
    fontSize: 15,
    fontWeight: '700',
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderBottomColor: '#1A1512',
    alignItems: 'center',
  },
  heroArrow: {
    color: '#D03024',
    fontSize: 22,
    fontWeight: '800',
  },
  heroName: {
    marginTop: spacing.sm,
    color: '#1A1512',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroPriceBlock: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  heroOriginal: {
    color: '#7B6B60',
    textDecorationLine: 'line-through',
    fontSize: 15,
    fontWeight: '700',
  },
  heroPriceNum: {
    color: '#D03024',
    fontSize: 84,
    fontWeight: '900',
    letterSpacing: -5,
    lineHeight: 88,
    textShadowColor: '#1A1512',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  heroPriceUnit: {
    marginTop: -6,
    color: '#D03024',
    fontSize: 28,
    fontWeight: '900',
  },
  heroSaleTag: {
    marginTop: spacing.xs,
    color: '#1A1512',
    backgroundColor: '#FFD500',
    borderWidth: 2,
    borderColor: '#1A1512',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  secondSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1512',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  secondTextWrap: {
    flex: 1,
  },
  secondLabel: {
    color: '#D03024',
    fontSize: 14,
    fontWeight: '900',
  },
  secondName: {
    marginTop: spacing.xs,
    color: '#1A1512',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  secondPrice: {
    marginTop: spacing.xs,
    color: '#D03024',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  secondDiscount: {
    color: '#D03024',
    fontSize: 22,
    fontWeight: '900',
  },
  listSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listTitle: {
    color: '#1A1512',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#1A1512',
    padding: spacing.sm,
    minHeight: 110,
  },
  noteYellow: { backgroundColor: '#FFF8C8' },
  notePink: { backgroundColor: '#FFD8D2' },
  noteBlue: { backgroundColor: '#D8E8FF' },
  noteTopRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  noteName: {
    flex: 1,
    color: '#1A1512',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  notePrice: {
    marginTop: spacing.sm,
    color: '#D03024',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  noteDiscount: {
    color: '#1A1512',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  footer: {
    borderTopWidth: 2,
    borderTopColor: '#1A1512',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    color: '#D03024',
    fontSize: 16,
    fontWeight: '800',
  },
  posterFallback: {
    backgroundColor: '#F5EDD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0C19A',
  },
  posterFallbackEmoji: {
    fontSize: 24,
  },
});

export default PosterFlyerTemplate;
