import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, priceTagGradients } from '../../theme';
import { PJS } from '../../theme/typography';
import type { PriceTag as PriceTagData } from '../../types/api.types';

export type PriceTagVariant = 'hero' | 'card' | 'compact';

interface PriceTagProps {
  priceTag: PriceTagData;
  variant?: PriceTagVariant;
  style?: ViewStyle;
}

/**
 * 가격표 타입별 라벨 텍스트.
 * - bundle: bundleType(1+1/2+1/3+1)로 치환
 * - flat: flatGroupName이 있으면 그룹명 우선
 * - cardPayment: cardLabel이 있으면 카드명 우선
 */
export function getPriceTagLabel(tag: PriceTagData): string {
  switch (tag.type) {
    case 'normal':
      return '일반가';
    case 'sale':
      return '할인가';
    case 'special':
      return '특가';
    case 'closing':
      return '마감할인';
    case 'bundle':
      return tag.bundleType ?? '묶음';
    case 'flat':
      return tag.flatGroupName ?? '균일가';
    case 'member':
      return '회원가';
    case 'cardPayment':
      return tag.cardLabel ? `${tag.cardLabel} 할인` : '카드 할인';
    default:
      return '';
  }
}

/**
 * PriceTag — 가격표 타입을 시각적으로 표시하는 컴포넌트.
 *
 * - hero: 풀-그라디언트 카드 (HomeScreen 메인 카드 내부용)
 * - card: 중형 그라디언트 pill 뱃지 (상품 카드 상단)
 * - compact: 텍스트 pill (리스트/검색 결과)
 */
function PriceTagBase({
  priceTag,
  variant = 'card',
  style,
}: PriceTagProps) {
  const label = getPriceTagLabel(priceTag);
  const gradient = priceTagGradients[priceTag.type];

  // normal 타입은 뱃지 불필요 — compact/card에서 렌더링 생략
  if (priceTag.type === 'normal' && variant !== 'hero') {
    return null;
  }

  if (variant === 'compact') {
    return (
      <View
        style={[
          styles.compactBase,
          { backgroundColor: gradient[0] + '1A', borderColor: gradient[0] },
          style,
        ]}
      >
        <Text style={[styles.compactText, { color: gradient[1] }]}>
          {label}
        </Text>
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardBase, style]}
      >
        <Text style={styles.cardText}>{label}</Text>
      </LinearGradient>
    );
  }

  // hero
  return (
    <LinearGradient
      colors={[gradient[0], gradient[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroBase, style]}
    >
      <Text style={styles.heroLabel}>{label}</Text>
      {priceTag.note ? (
        <Text style={styles.heroNote} numberOfLines={1}>
          {priceTag.note}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

export const PriceTag = React.memo(PriceTagBase);

const styles = StyleSheet.create({
  compactBase: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  compactText: {
    fontFamily: PJS.bold,
    fontSize: 11,
    letterSpacing: -0.1,
  },
  cardBase: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardText: {
    fontFamily: PJS.bold,
    fontSize: 12,
    color: colors.white,
    letterSpacing: -0.1,
  },
  heroBase: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  heroLabel: {
    fontFamily: PJS.extraBold,
    fontSize: 13,
    color: colors.white,
    letterSpacing: -0.2,
  },
  heroNote: {
    fontFamily: PJS.medium,
    fontSize: 11,
    color: colors.bannerTextMuted,
    maxWidth: 180,
  },
});
