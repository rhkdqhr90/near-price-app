import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import type { MyPageScreenProps } from '../../navigation/types';
import { useNoticeList } from '../../hooks/queries/useNotice';
import type { NoticeResponse } from '../../types/api.types';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'NoticeList'>;

interface NoticeItemProps {
  item: NoticeResponse;
  onPress: (id: string) => void;
}

const NoticeItem = React.memo<NoticeItemProps>(({ item, onPress }) => {
  const date = new Date(item.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`공지사항 ${item.title}`}
    >
      <View style={styles.itemHeader}>
        {item.isPinned ? (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedBadgeText}>공지</Text>
          </View>
        ) : null}
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      <Text style={styles.itemDate}>{date}</Text>
    </TouchableOpacity>
  );
});

const ItemSeparator: React.FC = () => <View style={styles.separator} />;

const NoticeListScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch } = useNoticeList();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePressItem = useCallback(
    (id: string) => navigation.navigate('NoticeDetail', { noticeId: id }),
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: NoticeResponse }) => (
      <NoticeItem item={item} onPress={handlePressItem} />
    ),
    [handlePressItem],
  );

  if (isLoading) {
    return <LoadingView message="공지사항을 불러오는 중..." />;
  }
  if (isError) {
    return <ErrorView message="공지사항을 불러오지 못했습니다" onRetry={refetch} />;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="등록된 공지사항이 없습니다" />;
  }

  return (
    <FlatList
      style={styles.container}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  item: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pinnedBadge: {
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
    paddingVertical: spacing.micro,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.micro,
  },
  pinnedBadgeText: {
    ...typography.captionBold,
    color: colors.white,
  },
  itemTitle: {
    ...typography.headingMd,
    flex: 1,
  },
  itemDate: {
    ...typography.caption,
    color: colors.gray600,
  },
  separator: {
    height: 0.5,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.xl,
  },
});

export default NoticeListScreen;
