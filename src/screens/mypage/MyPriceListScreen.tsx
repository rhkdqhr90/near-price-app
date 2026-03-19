import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import type { PriceResponse } from '../../types/api.types';
import { useMyPrices } from '../../hooks/queries/usePrices';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import TagIcon from '../../components/icons/TagIcon';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'MyPriceList'>;

interface PriceListItemProps {
  item: PriceResponse;
}

const PriceListItem = React.memo<PriceListItemProps>(({ item }) => (
  <View style={styles.card}>
    <View style={styles.colorBar} />
    <View style={styles.cardBody}>
      <Text style={styles.productName} numberOfLines={1}>
        {item.product.name}
      </Text>
      <Text style={styles.storeName} numberOfLines={1}>
        {item.store.name}
      </Text>
    </View>
    <View style={styles.cardRight}>
      <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
      <Text style={styles.priceTime}>{formatRelativeTime(item.createdAt)}</Text>
    </View>
  </View>
));

const MyPriceListScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const { data: myPrices, isLoading, isError, refetch } = useMyPrices();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PriceResponse>) => <PriceListItem item={item} />,
    [],
  );

  if (isLoading) {
    return <LoadingView message="등록 이력을 불러오는 중..." />;
  }
  if (isError) {
    return (
      <ErrorView message="등록 이력을 불러오지 못했습니다." onRetry={refetch} />
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      data={myPrices ?? []}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
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
    borderRadius: 12,
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
    borderRadius: 2,
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
});

export default MyPriceListScreen;
