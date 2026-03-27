import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  type ListRenderItemInfo,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import type { PriceResponse } from '../../types/api.types';
import { useMyPrices, useDeleteMyPrice } from '../../hooks/queries/usePrices';
import SkeletonCard from '../../components/common/SkeletonCard';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import TagIcon from '../../components/icons/TagIcon';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'MyPriceList'>;

const MyPriceListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: myPrices, isLoading, isError, refetch } = useMyPrices();
  const { mutate: deletePrice } = useDeleteMyPrice();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const handleNavigatePriceCompare = useCallback(
    (productId: string, productName: string) => {
      navigation.getParent()?.navigate('HomeStack', {
        screen: 'PriceCompare',
        params: { productId, productName },
      });
    },
    [navigation],
  );

  const handleDelete = useCallback((item: PriceResponse) => {
    Alert.alert(
      '가격 삭제',
      `${item.product.name} 가격 정보를 삭제할까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => {
            swipeableRefs.current.get(item.id)?.close();
          },
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deletePrice(item.id, {
            onError: () => {
              Alert.alert('삭제 실패', '가격 정보를 삭제하지 못했습니다. 다시 시도해 주세요.');
            },
          }),
        },
      ],
    );
  }, [deletePrice]);

  const renderDeleteAction = useCallback(
    (item: PriceResponse) => (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            swipeableRefs.current.get(item.id)?.close();
            handleDelete(item);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.product.name} 삭제`}
        >
          <Text style={styles.deleteActionText}>삭제</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleDelete],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PriceResponse>) => (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          } else {
            swipeableRefs.current.delete(item.id);
          }
        }}
        renderRightActions={() => renderDeleteAction(item)}
        overshootRight={false}
        rightThreshold={50}
        friction={2}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleNavigatePriceCompare(item.product.id, item.product.name)}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.product.name} ${formatPrice(item.price)} ${item.store?.name ?? '매장'}`}
        >
          <View style={styles.colorBar} />
          <View style={styles.cardBody}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.store?.name ?? '매장 정보 없음'}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
            <Text style={styles.priceTime}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    ),
    [handleNavigatePriceCompare, handleDelete, renderDeleteAction],
  );

  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }],
    [insets.bottom],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  if (isLoading) {
    return <SkeletonCard variant="price" />;
  }
  if (isError) {
    return (
      <ErrorView message="등록 이력을 불러오지 못했습니다." onRetry={refetch} />
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={contentStyle}
      data={myPrices ?? []}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon={TagIcon}
          title="아직 등록한 가격이 없어요"
          subtitle="매장에서 가격을 발견하면 등록해 주세요"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: spacing.cardGap,
  },
  colorBar: {
    width: 3,
    backgroundColor: colors.primary,
    alignSelf: 'stretch',
    marginVertical: spacing.md,
    marginLeft: spacing.inputPad,
    borderRadius: spacing.micro,
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.inputPad,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  productName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  storeName: {
    ...typography.bodySm,
  },
  cardRight: {
    alignItems: 'flex-end',
    paddingVertical: spacing.inputPad,
    paddingRight: spacing.lg,
  },
  priceValue: {
    ...typography.price,
    color: colors.primary,
    marginBottom: spacing.micro,
  },
  priceTime: {
    ...typography.caption,
  },
  deleteActionContainer: {
    justifyContent: 'center',
    marginBottom: spacing.cardGap,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: spacing.radiusMd,
    borderBottomRightRadius: spacing.radiusMd,
  },
  deleteActionText: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.white,
  },
});

export default MyPriceListScreen;
