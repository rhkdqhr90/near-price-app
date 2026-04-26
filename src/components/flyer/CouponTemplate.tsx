import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FlyerProductItem } from '../../types/api.types';
import type { FlyerTemplateProps } from './ClassicTemplate';

// ─── CouponRow ────────────────────────────────────────────────────────────────

interface CouponRowProps {
  product: FlyerProductItem;
  pct: number | null;
  onPress: (product: FlyerProductItem) => void;
}

const CouponRow: React.FC<CouponRowProps> = ({ product, pct, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const handlePress = useCallback(() => onPress(product), [onPress, product]);
  const handleImageError = useCallback(() => setImageError(true), []);

  return (
    <TouchableOpacity
      style={styles.coupon}
      onPress={handlePress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} 상세보기`}
    >
      {/* 왼쪽: 상품 정보 */}
      <View style={styles.couponLeft}>
        {product.badges[0] ? (
          <View style={styles.couponBadge}>
            <Text style={styles.couponBadgeText}>{product.badges[0].label}</Text>
          </View>
        ) : null}
        <View style={styles.couponNameRow}>
          {/* 이미지 or 이모지 */}
          <View style={styles.couponImageBox}>
            {product.imageUrl && !imageError ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.couponImage}
                resizeMode="cover"
                onError={handleImageError}
              />
            ) : (
              <Text style={styles.couponEmoji}>{product.emoji}</Text>
            )}
          </View>
          <Text style={styles.couponName} numberOfLines={2}>{product.name}</Text>
        </View>
        <View style={styles.couponPriceRow}>
          {product.originalPrice !== null && (
            <Text style={styles.couponOriginal}>
              {product.originalPrice.toLocaleString('ko-KR')}원
            </Text>
          )}
          <Text style={styles.couponPrice}>{product.salePrice.toLocaleString('ko-KR')}</Text>
          <Text style={styles.couponPriceUnit}>원</Text>
        </View>
        {/* 바코드 장식 */}
        <View style={styles.barcodeRow}>
          {BARCODE_WIDTHS.map((w, i) => (
            <View key={i} style={[styles.barcodeLine, { width: w }]} />
          ))}
        </View>
      </View>

      {/* 중앙: 점선 구분자 */}
      <View style={styles.perforation}>
        <View style={styles.perforationNotchTop} />
        <View style={styles.perforationLine} />
        <View style={styles.perforationNotchBottom} />
      </View>

      {/* 오른쪽: 쿠폰 스텁 */}
      <View style={styles.couponStub}>
        <Text style={styles.stubLabel}>COUPON</Text>
        {pct !== null ? (
          <>
            <View style={styles.stubPctRow}>
              <Text style={styles.stubMinus}>-</Text>
              <Text style={styles.stubPct}>{pct}</Text>
            </View>
            <Text style={styles.stubPctSign}>%</Text>
          </>
        ) : (
          <Text style={styles.stubSpecial}>특가</Text>
        )}
        {product.imageUrl && !imageError ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.stubImage}
            resizeMode="cover"
            onError={handleImageError}
          />
        ) : (
          <Text style={styles.stubEmoji}>{product.emoji}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── CouponTemplate ───────────────────────────────────────────────────────────

const CouponTemplate: React.FC<FlyerTemplateProps> = ({ flyer, onProductPress }) => {
  const products = flyer.products ?? [];

  const maxPct = products.reduce((max, p) => {
    if (!p.originalPrice) { return max; }
    return Math.max(max, Math.round((1 - p.salePrice / p.originalPrice) * 100));
  }, 0);

  return (
    <View style={styles.container}>
      {/* 커버 카드 */}
      <View style={styles.cover}>
        <Text style={styles.coverCutLine}>✂ ─ ─ ─ ─ ─ CUT HERE ─ ─ ─ ─ ─ ✂</Text>
        <Text style={styles.coverTitle}>{flyer.storeName} 쿠폰북</Text>
        <Text style={styles.coverPeriod}>VALID · {flyer.dateRange}</Text>
        {products.length > 0 && (
          <Text style={styles.coverSummary}>
            총{' '}
            <Text style={styles.coverAccent}>{products.length}장</Text>
            의 쿠폰
            {maxPct > 0 ? (
              <>
                {' · 최대 '}
                <Text style={styles.coverAccent}>{maxPct}%</Text>
                {' 할인'}
              </>
            ) : null}
          </Text>
        )}
        {flyer.highlight ? (
          <Text style={styles.coverHighlight}>{flyer.highlight}</Text>
        ) : null}
      </View>

      {/* 쿠폰 리스트 */}
      {products.map((product) => {
        const pct = product.originalPrice
          ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
          : null;
        return (
          <CouponRow
            key={product.id}
            product={product}
            pct={pct}
            onPress={onProductPress}
          />
        );
      })}

      {/* 주의사항 */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          * 쿠폰 매장에서 제시 후 사용{'\n'}* 중복 할인 불가 · 1인 1회 한정
        </Text>
      </View>
    </View>
  );
};

// 바코드 패턴 (고정값 — 렌더마다 계산 불필요)
const BARCODE_WIDTHS = [1.5, 3, 1.5, 1.5, 3, 1.5, 3, 1.5, 1.5, 3, 1.5, 1.5, 3, 3, 1.5, 1.5, 3, 1.5, 3, 1.5];

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  // 커버 카드
  cover: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: spacing.radiusMd,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  coverCutLine: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: colors.black,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  coverPeriod: {
    fontSize: 11,
    color: colors.gray600,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  coverSummary: {
    fontSize: 13,
    color: colors.gray700,
  },
  coverAccent: {
    color: colors.primary,
    fontWeight: '800' as const,
  },
  coverHighlight: {
    fontSize: 11,
    color: colors.gray600,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 쿠폰 행
  coupon: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  couponLeft: {
    flex: 1,
    padding: spacing.md,
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.xs,
  },
  couponBadgeText: {
    fontSize: 9,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: 1,
  },
  couponNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  couponImageBox: {
    width: 36,
    height: 36,
    borderRadius: spacing.radiusSm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    flexShrink: 0,
  },
  couponImage: { width: '100%', height: '100%' },
  couponEmoji: { fontSize: 20 },
  couponName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  couponPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: spacing.sm,
  },
  couponOriginal: {
    fontSize: 11,
    color: colors.gray400,
    textDecorationLine: 'line-through',
    fontWeight: '500' as const,
  },
  couponPrice: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: colors.primary,
    letterSpacing: -0.8,
    lineHeight: 26,
  },
  couponPriceUnit: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.primary,
  },
  barcodeRow: {
    flexDirection: 'row',
    height: 20,
    gap: 1,
    alignItems: 'stretch',
    marginTop: spacing.xs,
  },
  barcodeLine: {
    backgroundColor: colors.black,
    opacity: 0.65,
    height: '100%',
  },

  // 점선 구분자
  perforation: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: -8,
    position: 'relative',
  },
  perforationNotchTop: {
    position: 'absolute',
    top: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  perforationNotchBottom: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  perforationLine: {
    flex: 1,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },

  // 쿠폰 스텁
  couponStub: {
    width: 80,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: 2,
  },
  stubLabel: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 3,
  },
  stubPctRow: { flexDirection: 'row', alignItems: 'flex-end' },
  stubMinus: { fontSize: 16, fontWeight: '900' as const, color: colors.white, lineHeight: 28 },
  stubPct: {
    fontSize: 30,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: -1.5,
    lineHeight: 34,
  },
  stubPctSign: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: colors.white,
    marginTop: -4,
  },
  stubSpecial: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: -0.5,
  },
  stubImage: { width: 28, height: 28, borderRadius: 4, marginTop: spacing.xs },
  stubEmoji: { fontSize: 20, marginTop: spacing.xs },

  // 주의사항
  footerNote: {
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerNoteText: {
    fontSize: 10,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});

export default CouponTemplate;
