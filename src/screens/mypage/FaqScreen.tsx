import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { MyPageScreenProps } from '../../navigation/types';
import { useFaqList } from '../../hooks/queries/useFaq';
import type { FaqItemResponse } from '../../types/api.types';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import ChevronUpIcon from '../../components/icons/ChevronUpIcon';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import EmptyView from '../../components/common/EmptyView';
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
  // useRef로 Set 관리하여 renderItem이 매 토글마다 재생성되는 것을 방지
  const expandedIdsRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  const handleToggle = useCallback((id: string) => {
    if (expandedIdsRef.current.has(id)) {
      expandedIdsRef.current.delete(id);
    } else {
      expandedIdsRef.current.add(id);
    }
    forceUpdate((n) => n + 1);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FaqItemResponse }) => (
      <FaqItem
        item={item}
        isExpanded={expandedIdsRef.current.has(item.id)}
        onToggle={handleToggle}
      />
    ),
    [handleToggle],
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
    return <EmptyView message="등록된 FAQ가 없습니다" />;
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
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
