import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  RefreshControl,
} from 'react-native';
import type { MyPageScreenProps } from '../../navigation/types';
import { useFaqList } from '../../hooks/queries/useFaq';
import type { FaqItemResponse } from '../../types/api.types';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import ChevronUpIcon from '../../components/icons/ChevronUpIcon';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'Faq'>;

interface FaqItemProps {
  item: FaqItemResponse;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const FaqItem = React.memo<FaqItemProps>(({ item, isExpanded, onToggle }) => (
  <View style={styles.faqItem}>
    <TouchableOpacity
      style={styles.questionRow}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`질문: ${item.question}`}
      accessibilityState={{ expanded: isExpanded }}
    >
      <Text style={styles.questionPrefix}>Q.</Text>
      <Text style={styles.questionText}>{item.question}</Text>
      {isExpanded ? (
        <ChevronUpIcon size={spacing.iconSm} color={colors.gray600} />
      ) : (
        <ChevronDownIcon size={spacing.iconSm} color={colors.gray600} />
      )}
    </TouchableOpacity>
    {isExpanded ? (
      <View style={styles.answerContainer}>
        <Text style={styles.answerPrefix}>A.</Text>
        <Text style={styles.answerText}>{item.answer}</Text>
      </View>
    ) : null}
  </View>
));

const FaqScreen: React.FC<Props> = () => {
  const { data, isLoading, isError, refetch } = useFaqList();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        200,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: FaqItemResponse }) => (
      <FaqItem
        item={item}
        isExpanded={expandedIds.has(item.id)}
        onToggle={handleToggle}
      />
    ),
    [expandedIds, handleToggle],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; data: FaqItemResponse[] } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const sections = useMemo(
    () => (data ?? []).map((group) => ({ title: group.category ?? '기타', data: group.items })),
    [data],
  );

  if (isLoading) {
    return <LoadingView message="FAQ를 불러오는 중..." />;
  }
  if (isError) {
    return <ErrorView message="FAQ를 불러오지 못했습니다" onRetry={refetch} />;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="등록된 FAQ가 없습니다" />;
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
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
    backgroundColor: colors.gray100,
  },
  sectionHeader: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionHeaderText: {
    ...typography.tagText,
    color: colors.gray600,
  },
  faqItem: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  questionPrefix: {
    ...typography.headingMd,
    color: colors.primary,
    width: spacing.xl,
  },
  questionText: {
    ...typography.headingMd,
    flex: 1,
  },
  answerContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray200,
  },
  answerPrefix: {
    ...typography.bodySm,
    color: colors.gray600,
    width: spacing.xl,
    paddingTop: spacing.sm,
  },
  answerText: {
    ...typography.bodyMd,
    color: colors.gray700,
    flex: 1,
    paddingTop: spacing.sm,
    lineHeight: 22,
  },
});

export default FaqScreen;
