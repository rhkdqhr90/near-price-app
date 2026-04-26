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

const toDiscount = (item: FlyerProductItem): number | null => {
  if (!item.originalPrice || item.originalPrice <= 0) {
    return null;
  }
  return Math.max(0, Math.round((1 - item.salePrice / item.originalPrice) * 100));
};

const SmallPhoto: React.FC<{ item: FlyerProductItem; size?: number }> = ({ item, size = 56 }) => {
  const [hasError, setHasError] = useState(false);
  const uri = fixImageUrl(item.imageUrl);

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={[styles.smallPhotoFallback, { width: size, height: size }]}
    >
      <Text style={styles.smallPhotoEmoji}>{item.emoji || '🛒'}</Text>
    </View>
  );
};

const NewsFlyerTemplate: React.FC<Props> = ({ flyer, onProductPress }) => {
  const products = useMemo(() => flyer.products ?? [], [flyer.products]);
  const hero = products[0] ?? null;
  const heroDiscountRate = hero ? toDiscount(hero) : null;

  const chunks = useMemo(() => {
    const list = products.slice(1);
    const rows: FlyerProductItem[][] = [];
    for (let i = 0; i < list.length; i += 2) {
      rows.push(list.slice(i, i + 2));
    }
    return rows;
  }, [products]);

  return (
    <View style={styles.paper}>
      <View style={styles.mastheadTop}>
        <Text style={styles.mastheadMeta}>VOL.{new Date().getMonth() + 1} · 삽지특집</Text>
        <Text style={styles.mastheadMeta}>{flyer.dateRange}</Text>
      </View>

      <View style={styles.mastheadMain}>
        <Text style={styles.mastheadTitle}>동네경제신문</Text>
        <Text style={styles.mastheadSub}>특별 할인 안내문</Text>
      </View>

      {hero ? (
        <TouchableOpacity
          style={styles.heroBlock}
          onPress={() => onProductPress(hero)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${hero.name} 상세보기`}
        >
          <Text style={styles.heroLabel}>1면 머리기사</Text>
          <Text style={styles.heroHeadline}>
            "{hero.name}, {heroDiscountRate !== null ? `${heroDiscountRate}% 인하` : '이번 주 특가'}"
          </Text>
          <View style={styles.heroBodyRow}>
            <View style={styles.heroStoryTextWrap}>
              <Text style={styles.heroDropCap}>{flyer.storeName.charAt(0) || '동'}</Text>
              <Text style={styles.heroStoryText}>
                {flyer.storeName}이(가) {flyer.dateRange} 한정으로 주요 식재료 가격을 낮췄다.
                {flyer.highlight ? ` ${flyer.highlight}` : ''}
              </Text>
            </View>
            <View style={styles.heroPhotoBox}>
              <SmallPhoto item={hero} size={72} />
            </View>
          </View>
          <View style={styles.heroPriceRow}>
            {hero.originalPrice !== null && (
              <Text style={styles.heroOriginal}>정가 {formatPrice(hero.originalPrice)}</Text>
            )}
            <Text style={styles.heroPrice}>{formatPrice(hero.salePrice)}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {chunks.map((row, rowIdx) => (
        <View key={`news-row-${rowIdx}`} style={styles.columnRow}>
          {row.map((item, itemIdx) => {
            const itemDiscountRate = toDiscount(item);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.columnCard,
                  itemIdx === 1 && styles.columnCardRight,
                ]}
                onPress={() => onProductPress(item)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} 상세보기`}
              >
                <Text style={styles.columnLabel}>제 {String(rowIdx * 2 + itemIdx + 2).padStart(2, '0')} 호</Text>
                <View style={styles.columnTopRow}>
                  <SmallPhoto item={item} />
                  <View style={styles.columnMain}>
                    <Text style={styles.columnName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.columnPrice}>{formatPrice(item.salePrice)}</Text>
                  </View>
                </View>
                {itemDiscountRate !== null && (
                  <Text style={styles.columnDiscount}>
                    ▼{itemDiscountRate}% (전 {item.originalPrice?.toLocaleString('ko-KR')}원)
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          {row.length === 1 && <View style={styles.columnCardPlaceholder} />}
        </View>
      ))}

      <View style={styles.bottomAd}>
        <Text style={styles.bottomAdBadge}>광고</Text>
        <Text style={styles.bottomAdTitle}>이 신문 지참 고객 추가 5% 할인</Text>
        <Text style={styles.bottomAdSub}>{flyer.storeName} · {flyer.dateRange}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#F5EFDD',
    borderWidth: 1,
    borderColor: '#1A1512',
    paddingBottom: spacing.md,
  },
  mastheadTop: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1512',
  },
  mastheadMeta: {
    fontSize: 9,
    color: '#5A4D40',
    fontWeight: '700',
    paddingBottom: spacing.sm,
  },
  mastheadMain: {
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: '#1A1512',
    alignItems: 'center',
  },
  mastheadTitle: {
    fontSize: 28,
    color: '#1A1512',
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  mastheadSub: {
    marginTop: spacing.xs,
    color: '#7D6550',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroBlock: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1512',
  },
  heroLabel: {
    fontSize: 10,
    color: '#C81D11',
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroHeadline: {
    marginTop: spacing.xs,
    fontSize: 20,
    color: '#1A1512',
    fontWeight: '900',
    lineHeight: 27,
  },
  heroBodyRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroStoryTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroDropCap: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1512',
    lineHeight: 38,
    marginRight: 4,
  },
  heroStoryText: {
    flex: 1,
    color: '#2C2621',
    lineHeight: 20,
    fontSize: 12,
  },
  heroPhotoBox: {
    width: 74,
    height: 74,
    borderWidth: 1,
    borderColor: '#1A1512',
    overflow: 'hidden',
  },
  heroPriceRow: {
    marginTop: spacing.sm,
  },
  heroOriginal: {
    color: '#6B645B',
    textDecorationLine: 'line-through',
    fontSize: 12,
    fontWeight: '700',
  },
  heroPrice: {
    color: '#C81D11',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 1,
  },
  columnRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1512',
  },
  columnCard: {
    flex: 1,
    padding: spacing.md,
  },
  columnCardRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#1A1512',
  },
  columnCardPlaceholder: {
    flex: 1,
  },
  columnLabel: {
    color: '#C81D11',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  columnTopRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  columnMain: {
    flex: 1,
  },
  columnName: {
    color: '#1A1512',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  columnPrice: {
    color: '#1A1512',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  columnDiscount: {
    marginTop: spacing.xs,
    color: '#C81D11',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomAd: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: '#C81D11',
    padding: spacing.sm,
    backgroundColor: '#FFF8F7',
  },
  bottomAdBadge: {
    color: '#C81D11',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomAdTitle: {
    marginTop: spacing.xs,
    color: '#1A1512',
    fontSize: 14,
    fontWeight: '900',
  },
  bottomAdSub: {
    marginTop: 2,
    color: '#6B645B',
    fontSize: 11,
    fontWeight: '700',
  },
  smallPhotoFallback: {
    backgroundColor: '#1A1512',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPhotoEmoji: {
    fontSize: 28,
  },
});

export default NewsFlyerTemplate;
