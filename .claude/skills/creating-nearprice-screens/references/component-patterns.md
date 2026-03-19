# Component 패턴

## 재사용 컴포넌트 구조

```typescript
// components/price/PriceRankCard.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../utils/theme';
import { formatPrice } from '../../utils/format';

interface PriceRankCardProps {
  rank: number;
  price: number;
  storeName: string;
  distance: string;
  updatedAt: string;
  onPress: () => void;
}

export const PriceRankCard: React.FC<PriceRankCardProps> = memo(({
  rank,
  price,
  storeName,
  distance,
  updatedAt,
  onPress,
}) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.price}>{formatPrice(price)}원</Text>
      <Text style={styles.store}>{storeName} ({distance})</Text>
    </View>
    <Text style={styles.time}>{updatedAt}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  store: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: colors.textHint,
  },
});
```

## theme.ts — 공통 색상/간격

모든 컴포넌트에서 하드코딩 색상/간격 금지. 반드시 이 파일에서 import.

```typescript
// utils/theme.ts
export const colors = {
  primary: '#1B4F72',
  secondary: '#2E86C1',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textPrimary: '#212529',
  textSecondary: '#5D6D7E',
  textHint: '#ABB2B9',
  border: '#F0F0F0',
  error: '#E74C3C',
  success: '#27AE60',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

## format.ts — 유틸리티

```typescript
// utils/format.ts
export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
};
```

## StyleSheet 규칙

```typescript
// ✅ 올바름 — StyleSheet.create + theme 상수
import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../utils/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});

// ❌ 금지 — 인라인 스타일
<View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

// ❌ 금지 — 하드코딩 색상
const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF' },  // colors.background 사용할 것
});
```

## memo 사용 기준
- FlatList renderItem 컴포넌트 → 반드시 memo
- 자주 re-render 되는 부모의 자식 → memo
- 단순 래퍼/레이아웃 컴포넌트 → memo 불필요

## 금지사항
- 인라인 스타일 금지 → StyleSheet.create
- 하드코딩 색상/간격 금지 → theme.ts import
- 컴포넌트 파일에 2개 이상 export 금지 (한 파일 한 컴포넌트)
- Props를 any로 받기 금지 → interface 필수 정의
