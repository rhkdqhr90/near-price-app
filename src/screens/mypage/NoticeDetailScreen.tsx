import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { MyPageScreenProps } from '../../navigation/types';
import { useNoticeDetail } from '../../hooks/queries/useNotice';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'NoticeDetail'>;

const NoticeDetailScreen: React.FC<Props> = ({ route }) => {
  const { noticeId } = route.params;
  const { data: notice, isLoading, isError, refetch } = useNoticeDetail(noticeId);

  if (isLoading) {
    return <LoadingView message="공지사항을 불러오는 중..." />;
  }
  if (isError || !notice) {
    return <ErrorView message="공지사항을 불러오지 못했습니다" onRetry={refetch} />;
  }

  const date = new Date(notice.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.content}>{notice.content}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headingLg,
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: colors.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  content: {
    ...typography.bodyMd,
    color: colors.gray700,
    lineHeight: spacing.xxl,
  },
});

export default NoticeDetailScreen;
