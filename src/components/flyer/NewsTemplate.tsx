import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FlyerProductItem } from '../../types/api.types';
import type { FlyerTemplateProps } from './ClassicTemplate';

// ─── TopStory ────────────────────────────────────────────────────────────────

interface TopStoryProps {
  hero: FlyerProductItem;
  savePct: number | null;
  storeName: string;
  dateRange: string;
  highlight: string | null | undefined;
  onPress: (product: FlyerProductItem) => void;
}

const TopStory: React.FC<TopStoryProps> = ({ hero, savePct, storeName, dateRange, highlight, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const handlePress = useCallback(() => onPress(hero), [onPress, hero]);
  const handleImageError = useCallback(() => setImageError(true), []);

  return (
    <TouchableOpacity
      style={styles.topStory}
      onPress={handlePress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${hero.name} 상세보기`}
    >
      <Text style={styles.topStoryLabel}>── TOP STORY ──</Text>
      <Text style={styles.topStoryHeadline}>
        {`"${hero.name},\n${savePct !== null ? `전주 대비 ${savePct}% 파격 인하"` : '이번 주 특가 행사"'}`}
      </Text>
      <View style={styles.topStoryBodyRow}>
        <View style={styles.topStoryImageBox}>
          {hero.imageUrl && !imageError ? (
            <Image
              source={{ uri: hero.imageUrl }}
              style={styles.topStoryImage}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <Text style={styles.topStoryEmoji}>{hero.emoji}</Text>
          )}
        </View>
        <View style={styles.topStoryText}>
          <Text style={styles.topStoryDropCap}>{storeName.charAt(0)}</Text>
          <Text style={styles.topStoryBody}>
            {storeName}이(가) {dateRange} 기간 동안 주요 상품을
            {savePct !== null ? ` 최대 ${savePct}%까지 ` : ' '}할인한다.
            {highlight ? ` "${highlight}"` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.topStoryPrice}>
        {hero.originalPrice !== null && (
          <Text style={styles.topStoryOriginal}>
            정가 {hero.originalPrice.toLocaleString('ko-KR')}원
          </Text>
        )}
        <View style={styles.topStoryPriceRow}>
          <Text style={styles.topStoryPriceNum}>{hero.salePrice.toLocaleString('ko-KR')}</Text>
          <Text style={styles.topStoryPriceUnit}>원</Text>
          {savePct !== null && (
            <View style={styles.topStoryPctBadge}>
              <Text style={styles.topStoryPctText}>▼{savePct}%</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── ColumnItem ───────────────────────────────────────────────────────────────

interface ColumnItemProps {
  product: FlyerProductItem;
  index: number;
  onPress: (product: FlyerProductItem) => void;
}

const ColumnItem: React.FC<ColumnItemProps> = ({ product, index, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const handlePress = useCallback(() => onPress(product), [onPress, product]);
  const handleImageError = useCallback(() => setImageError(true), []);

  const pct = product.originalPrice
    ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.columnItem,
        index > 1 && styles.columnItemTopBorder,
        index % 2 === 1 && styles.columnItemLeftBorder,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} 상세보기`}
    >
      <Text style={styles.columnNum}>── ITEM NO.{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.columnNameRow}>
        <View style={styles.columnImageBox}>
          {product.imageUrl && !imageError ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.columnImage}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <Text style={styles.columnEmoji}>{product.emoji}</Text>
          )}
        </View>
        <Text style={styles.columnName} numberOfLines={2}>{product.name}</Text>
      </View>
      <View style={styles.columnPriceRow}>
        <Text style={styles.columnPrice}>{product.salePrice.toLocaleString('ko-KR')}</Text>
        <Text style={styles.columnPriceUnit}>원</Text>
      </View>
      {pct !== null && (
        <Text style={styles.columnDiscount}>
          ▼{pct}%
          {product.originalPrice !== null
            ? ` (정가 ${product.originalPrice.toLocaleString('ko-KR')})`
            : ''}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─── NewsTemplate ─────────────────────────────────────────────────────────────

const NewsTemplate: React.FC<FlyerTemplateProps> = ({ flyer, onDirection, onProductPress }) => {
  const products = flyer.products ?? [];
  const hero = products[0] ?? null;

  const heroSavePct = hero?.originalPrice
    ? Math.round((1 - hero.salePrice / hero.originalPrice) * 100)
    : null;

  return (
    <View style={styles.paper}>
      {/* 마스트헤드 */}
      <View style={styles.masthead}>
        <View style={styles.mastheadTopRow}>
          <Text style={styles.mastheadMeta}>VOL.{new Date().getMonth() + 1}{String(new Date().getDate()).padStart(2,'0')} · ₩0</Text>
          <Text style={styles.mastheadMeta}>{flyer.dateRange}</Text>
        </View>
        <Text style={styles.mastheadTitle}>동네가격일보</Text>
        <Text style={styles.mastheadSub}>
          ── {flyer.storeName.toUpperCase()} SPECIAL EDITION ──
        </Text>
      </View>

      {/* 바이라인 */}
      <View style={styles.byline}>
        <Text style={styles.bylineText}>편집 · 동네 주민</Text>
        <Text style={styles.bylineText}>{flyer.promotionTitle}</Text>
      </View>

      {/* Top Story */}
      {hero ? (
        <TopStory
          hero={hero}
          savePct={heroSavePct}
          storeName={flyer.storeName}
          dateRange={flyer.dateRange}
          highlight={flyer.highlight}
          onPress={onProductPress}
        />
      ) : null}

      {/* 상품 컬럼 */}
      <View style={styles.columns}>
        {products.map((product, i) => (
          <ColumnItem
            key={product.id}
            product={product}
            index={i}
            onPress={onProductPress}
          />
        ))}
      </View>

      {/* 사장님 한마디 광고 블록 */}
      {flyer.ownerQuote ? (
        <View style={styles.adBlock}>
          <View style={styles.adIcon}>
            <Text style={styles.adIconText}>!</Text>
          </View>
          <View style={styles.adContent}>
            <Text style={styles.adLabel}>── 사장님 한마디 ──</Text>
            <Text style={styles.adText}>"{flyer.ownerQuote}"</Text>
            {flyer.ownerName ? (
              <Text style={styles.adAuthor}>— {flyer.ownerName}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* 푸터 */}
      <TouchableOpacity
        style={styles.footer}
        onPress={onDirection}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="매장 위치 보기"
      >
        <Text style={styles.footerLeft}>PAGE 1/1</Text>
        <Text style={styles.footerCenter} numberOfLines={1}>
          {flyer.storeAddress ?? flyer.storeName}
        </Text>
        <Text style={styles.footerRight}>위치 보기 →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.flyerPaper,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.flyerInk,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  // 마스트헤드
  masthead: {
    borderBottomWidth: 4,
    borderBottomColor: colors.flyerInk,
    borderTopWidth: 4,
    borderTopColor: colors.flyerInk,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  mastheadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  mastheadMeta: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.flyerInkMono,
    letterSpacing: 1.5,
  },
  mastheadTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.flyerInk,
    letterSpacing: -1.5,
    lineHeight: 36,
  },
  mastheadSub: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.flyerInkMono,
    letterSpacing: 3,
    marginTop: spacing.xs,
  },

  // 바이라인
  byline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.flyerInk,
  },
  bylineText: {
    fontSize: 9,
    color: colors.flyerInkMono,
    letterSpacing: 1,
  },

  // Top Story
  topStory: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.flyerInk,
  },
  topStoryLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 2.5,
    color: colors.flyerRed,
    marginBottom: spacing.sm,
  },
  topStoryHeadline: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.flyerInk,
    letterSpacing: -0.6,
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  topStoryBodyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topStoryImageBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.flyerInk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  topStoryImage: { width: '100%', height: '100%' },
  topStoryEmoji: { fontSize: 36 },
  topStoryText: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  topStoryDropCap: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.flyerInk,
    lineHeight: 34,
    marginRight: 3,
    marginTop: -2,
  },
  topStoryBody: {
    flex: 1,
    fontSize: 11,
    color: colors.flyerInk,
    lineHeight: 18,
    opacity: 0.85,
  },
  topStoryPrice: {
    borderTopWidth: 1,
    borderTopColor: colors.flyerInk,
    paddingTop: spacing.sm,
  },
  topStoryOriginal: {
    fontSize: 10,
    color: colors.flyerInk,
    opacity: 0.55,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  topStoryPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  topStoryPriceNum: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: colors.flyerInk,
    letterSpacing: -1,
  },
  topStoryPriceUnit: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.flyerInk,
  },
  topStoryPctBadge: {
    backgroundColor: colors.flyerRed,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  topStoryPctText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: 0.5,
  },

  // 상품 컬럼
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.flyerInk,
  },
  columnItem: {
    width: '50%',
    padding: spacing.md,
  },
  columnItemTopBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.flyerInk,
    borderStyle: 'dotted',
  },
  columnItemLeftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.flyerInk,
  },
  columnNum: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.flyerRed,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  columnNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.xs },
  columnImageBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 2,
    flexShrink: 0,
  },
  columnImage: { width: '100%', height: '100%' },
  columnEmoji: { fontSize: 18 },
  columnName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.flyerInk,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  columnPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  columnPrice: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.flyerInk,
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  columnPriceUnit: { fontSize: 11, fontWeight: '800' as const, color: colors.flyerInk },
  columnDiscount: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.flyerRed,
    marginTop: 2,
  },

  // 광고 블록
  adBlock: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.flyerInk,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  adIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.flyerInk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adIconText: { fontSize: 20, fontWeight: '900' as const, color: colors.flyerPaper },
  adContent: { flex: 1 },
  adLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: colors.flyerInkMono,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  adText: { fontSize: 12, fontWeight: '700' as const, color: colors.flyerInk, lineHeight: 18 },
  adAuthor: {
    fontSize: 10,
    color: colors.flyerInkMono,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  // 푸터
  footer: {
    borderTopWidth: 4,
    borderTopColor: colors.flyerInk,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.flyerInkMono,
    letterSpacing: 1,
  },
  footerCenter: {
    flex: 1,
    fontSize: 9,
    color: colors.flyerInkMono,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  footerRight: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: colors.flyerInk,
    letterSpacing: 0.5,
  },
});

export default NewsTemplate;
