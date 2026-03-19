# Screen 패턴

## 기본 화면 구조

```typescript
// screens/price/PriceCompareScreen.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductPrices } from '../../hooks/queries/usePrices';
import { LoadingView } from '../../components/common/LoadingView';
import { ErrorView } from '../../components/common/ErrorView';
import { EmptyView } from '../../components/common/EmptyView';
import { PriceRankCard } from '../../components/price/PriceRankCard';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PriceCompare'>;

export const PriceCompareScreen: React.FC<Props> = ({ route }) => {
  const { productId, productName } = route.params;
  const { data, isLoading, error, refetch } = useProductPrices(productId);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView message="가격 정보를 불러올 수 없습니다" onRetry={refetch} />;
  if (!data?.length) return <EmptyView message="등록된 가격이 없습니다" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PriceRankCard
            rank={index + 1}
            price={item.price}
            storeName={item.storeName}
            distance={item.distance}
            updatedAt={item.updatedAt}
            onPress={() => {/* navigate to StoreDetail */}}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
```

## 필수 3상태 처리

모든 데이터 fetch 화면은 반드시 세 가지 상태를 처리한다:
1. **로딩** — ActivityIndicator 또는 Skeleton
2. **에러** — 에러 메시지 + 재시도 버튼
3. **빈 상태** — 안내 메시지

```typescript
// components/common/LoadingView.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../utils/theme';

export const LoadingView: React.FC = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.secondary} />
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

```typescript
// components/common/ErrorView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../utils/theme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => (
  <View style={styles.center}>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>다시 시도</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

```typescript
// components/common/EmptyView.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../utils/theme';

interface EmptyViewProps {
  message: string;
}

export const EmptyView: React.FC<EmptyViewProps> = ({ message }) => (
  <View style={styles.center}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textHint,
    textAlign: 'center',
  },
});
```

## 네비게이션 타입 안전

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PriceCompare: { productId: string; productName: string };
  StoreDetail: { storeId: string };
  PriceEdit: { ocrResult: OcrResultType };
};

export type MainTabParamList = {
  Home: undefined;
  PriceRegister: undefined;
  Wishlist: undefined;
  MyPage: undefined;
};
```

```typescript
// 화면에서 사용
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PriceCompare'>;

export const PriceCompareScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, productName } = route.params;

  const handleStorePress = (storeId: string) => {
    navigation.navigate('StoreDetail', { storeId });
  };
  // ...
};
```

## 금지사항
- 화면에서 API 직접 호출 금지 → hooks/queries/ 훅 사용
- 200줄 초과 화면 → 하위 컴포넌트로 분리
- 하드코딩 문자열/색상 → constants, theme.ts 사용
- 네비게이션 파라미터 타입 없이 navigate 금지
