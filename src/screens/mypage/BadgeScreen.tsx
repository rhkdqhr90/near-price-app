import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import LoadingView from '../../components/common/LoadingView';
import ErrorView from '../../components/common/ErrorView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useUserBadges, useUserTrustScore } from '../../hooks/queries/useBadges';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import BadgeIcon, { BadgeType } from '../../components/icons/BadgeIcon';

type Props = MyPageScreenProps<'Badge'>;

interface BadgeGridItem {
  type: BadgeType | (string & {});
  name: string;
  icon: string;
  category: 'registration' | 'verification' | 'trust' | 'point';
  isEarned: boolean;
  description: string;
  earnedAt?: string;
  current?: number;
  threshold?: number;
}

type LevelBadgeKey = 'l1' | 'l2' | 'l3' | 'l4';

interface LevelBadgeItem {
  key: LevelBadgeKey;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  name: string;
  minTrustScore: number;
  icon: ImageSourcePropType;
}

const LEVEL_BADGES: LevelBadgeItem[] = [
  {
    key: 'l1',
    level: 'L1',
    name: '시작',
    minTrustScore: 0,
    icon: require('../../../assets/level-badges/l1-default.png'),
  },
  {
    key: 'l2',
    level: 'L2',
    name: '동네꾼',
    minTrustScore: 70,
    icon: require('../../../assets/level-badges/l2-happy.png'),
  },
  {
    key: 'l3',
    level: 'L3',
    name: '가격지기',
    minTrustScore: 85,
    icon: require('../../../assets/level-badges/l3-wink.png'),
  },
  {
    key: 'l4',
    level: 'L4',
    name: '알뜰왕',
    minTrustScore: 95,
    icon: require('../../../assets/level-badges/l4-sparkle.png'),
  },
];

const BADGE_DESCRIPTIONS: Record<string, string> = {
  'first_registration': '첫 가격 등록',
  'active_registerer': '활발한 등록자',
  'price_master': '가격 마스터',
  'first_verification': '첫 검증 완료',
  'verification_expert': '검증 전문가',
  'verification_master': '검증 마스터',
  'trusted_user': '신뢰받는 사용자',
  'highest_trust': '최고 신뢰도 사용자',
  'point_100': '포인트 100점 달성',
  'point_500': '포인트 500점 달성',
  'point_2000': '포인트 2000점 달성',
};

interface BadgeItemProps {
  badge: BadgeGridItem;
}

const BadgeItem = React.memo<BadgeItemProps>(({ badge }) => {
  const pct = Math.min(
    ((badge.current ?? 0) / (badge.threshold || 1)) * 100,
    100,
  );
  const progressWidth = { width: `${pct}%` as `${number}%` };

  return (
    <View
      style={[styles.badgeItem, !badge.isEarned && styles.badgeItemInactive]}
      accessible={true}
      accessibilityLabel={`${badge.name} 뱃지${badge.isEarned ? ' - 획득함' : ` - ${badge.current ?? 0}/${badge.threshold ?? 0}`}`}
    >
      <View
        style={[
          styles.badgeIconContainer,
          !badge.isEarned && styles.badgeIconContainerInactive,
        ]}
      >
        <BadgeIcon type={badge.type} size={32} earned={badge.isEarned} />
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      {badge.isEarned ? (
        <Text style={styles.badgeEarnedText}>획득함</Text>
      ) : (
        <View style={styles.badgeProgressContainer}>
          <View style={styles.badgeProgressBar}>
            <View style={[styles.badgeProgressFill, progressWidth]} />
          </View>
          <Text style={styles.badgeProgressText}>
            {badge.current ?? 0} / {badge.threshold ?? 0}
          </Text>
        </View>
      )}
    </View>
  );
});

const BadgeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const {
    data: badgesData,
    isLoading: badgesLoading,
    isError: badgesError,
    refetch: refetchBadges,
  } = useUserBadges(user?.id);

  const {
    data: trustScoreData,
    isLoading: trustScoreLoading,
    isError: trustScoreError,
    refetch: refetchTrustScore,
  } = useUserTrustScore(user?.id);

  const loading = badgesLoading || trustScoreLoading;
  const error = badgesError || trustScoreError;

  const handleRetry = React.useCallback(() => {
    refetchBadges();
    refetchTrustScore();
  }, [refetchBadges, refetchTrustScore]);

  const badgeItems = React.useMemo<BadgeGridItem[]>(() => {
    if (!badgesData) return [];

    const categoryOrder: Record<string, number> = {
      registration: 0,
      verification: 1,
      point: 2,
      trust: 3,
    };
    const allBadges: BadgeGridItem[] = [
      ...badgesData.earned.map(badge => ({
        type: badge.type,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        isEarned: true as const,
        description: BADGE_DESCRIPTIONS[badge.type] || badge.name,
        earnedAt: badge.earnedAt,
      })),
      ...badgesData.progress.map(badge => ({
        type: badge.type,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        isEarned: false as const,
        description: BADGE_DESCRIPTIONS[badge.type] || badge.name,
        current: badge.current,
        threshold: badge.threshold,
      })),
    ];

    return allBadges.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);
  }, [badgesData]);

  const stats = React.useMemo(() => ({
    registrations: trustScoreData?.totalRegistrations ?? 0,
    verifications: trustScoreData?.totalVerifications ?? 0,
    trustScore: trustScoreData?.trustScore ?? user?.trustScore ?? 0,
  }), [trustScoreData, user?.trustScore]);

  const currentLevelKey = React.useMemo<LevelBadgeKey>(() => {
    if (stats.trustScore >= 95) {
      return 'l4';
    }
    if (stats.trustScore >= 85) {
      return 'l3';
    }
    if (stats.trustScore >= 70) {
      return 'l2';
    }
    return 'l1';
  }, [stats.trustScore]);

  const earnedCount = badgesData?.earned.length ?? 0;
  const totalCount = (badgesData?.earned.length ?? 0) + (badgesData?.progress.length ?? 0);

  const containerStyle = React.useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );

  const contentContainerStyle = React.useMemo(
    () => ({ paddingBottom: spacing.xl + insets.bottom }),
    [insets.bottom],
  );

  if (!user) {
    return <LoadingView message="사용자 정보를 불러오는 중..." />;
  }
  if (loading) {
    return <LoadingView message="뱃지를 불러오는 중..." />;
  }
  if (error) {
    return <ErrorView message="뱃지를 불러오지 못했습니다" onRetry={handleRetry} />;
  }

  return (
    <View style={containerStyle}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ChevronLeftIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나의 뱃지</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      >
        {/* 활동 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.registrations}</Text>
            <Text style={styles.statLabel}>등록한 가격</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.verifications}</Text>
            <Text style={styles.statLabel}>검증 수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.trustScore}</Text>
            <Text style={styles.statLabel}>신뢰도</Text>
          </View>
        </View>

        {/* 레벨 캐릭터 섹션 */}
        <View style={styles.levelSection}>
          <Text style={styles.levelSectionTitle}>LEVEL BADGES</Text>
          <View style={styles.levelCard}>
            {LEVEL_BADGES.map((level) => (
              <View key={level.key} style={styles.levelItem}>
                <View
                  style={[
                    styles.levelRing,
                    LEVEL_RING_STYLE[level.key],
                    currentLevelKey === level.key && styles.levelRingActive,
                  ]}
                >
                  <Image source={level.icon} style={styles.levelCharacter} />
                  <View style={styles.levelChip}>
                    <Text style={styles.levelChipText}>{level.level}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.levelName,
                    currentLevelKey === level.key && styles.levelNameActive,
                  ]}
                >
                  {level.name}
                </Text>
                <Text style={styles.levelScoreHint}>{level.minTrustScore}+ 점</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 뱃지 보유 현황 */}
        <View style={styles.badgeCountSection}>
          <Text style={styles.badgeCountText}>
            <Text style={styles.badgeCountHighlight}>{earnedCount}</Text>
            {' / '}
            <Text>{totalCount}</Text>
          </Text>
          <Text style={styles.badgeCountSubtext}>뱃지 획득</Text>
        </View>

        {/* 뱃지 그리드 */}
        {badgeItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 뱃지가 없습니다</Text>
            <Text style={styles.emptySubtext}>가격 등록과 검증을 통해 뱃지를 획득해보세요!</Text>
          </View>
        )}

        {badgeItems.length > 0 && (
          <View style={styles.badgeGrid}>
            {badgeItems.map((badge) => (
              <BadgeItem key={`${badge.type}-${badge.isEarned ? 'earned' : 'progress'}`} badge={badge} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.headingMd,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: spacing.xxl,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },

  // 활동 통계
  statsSection: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.headingMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.gray600,
    textAlign: 'center',
  },

  // 레벨 캐릭터
  levelSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  levelSectionTitle: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  levelCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusXl,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelItem: {
    width: '24%',
    alignItems: 'center',
  },
  levelRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  levelRingActive: {
    transform: [{ scale: 1.05 }],
  },
  levelRingL1: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray700,
  },
  levelRingL2: {
    backgroundColor: colors.primary,
    borderColor: colors.gray700,
  },
  levelRingL3: {
    backgroundColor: colors.accent,
    borderColor: colors.gray700,
  },
  levelRingL4: {
    backgroundColor: colors.flyerBadgeYellow,
    borderColor: colors.gray700,
  },
  levelCharacter: {
    width: 44,
    height: 44,
  },
  levelChip: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    backgroundColor: colors.gray700,
    borderRadius: spacing.radiusLg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  levelChipText: {
    ...typography.captionBold,
    color: colors.white,
  },
  levelName: {
    ...typography.body,
    color: colors.gray700,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  levelNameActive: {
    color: colors.black,
  },
  levelScoreHint: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: 2,
  },

  // 뱃지 보유 현황
  badgeCountSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  badgeCountText: {
    ...typography.bodySm,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  badgeCountHighlight: {
    ...typography.headingMd,
    color: colors.primary,
  },
  badgeCountSubtext: {
    ...typography.bodySm,
    color: colors.gray600,
  },

  // 빈 상태
  emptyContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.headingMd,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  emptySubtext: {
    ...typography.bodySm,
    color: colors.gray600,
    textAlign: 'center',
  },

  // 뱃지 그리드
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.lg,
  },

  // 뱃지 아이템
  badgeItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeItemInactive: {
    borderColor: colors.gray200,
    opacity: 0.6,
  },

  badgeIconContainer: {
    width: spacing.fabSize,
    height: spacing.fabSize,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeIconContainerInactive: {
    backgroundColor: colors.gray200,
  },
  badgeName: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  badgeDescription: {
    ...typography.caption,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: spacing.lg,
  },

  badgeEarnedText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.primary,
  },

  badgeProgressContainer: {
    width: '100%',
    gap: spacing.xs,
  },
  badgeProgressBar: {
    width: '100%',
    height: spacing.cardTextGap,
    backgroundColor: colors.gray200,
    borderRadius: spacing.cardTextGap / 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  badgeProgressText: {
    ...typography.caption,
    color: colors.gray600,
    textAlign: 'center',
  },
});

const LEVEL_RING_STYLE: Record<LevelBadgeKey, ViewStyle> = {
  l1: styles.levelRingL1,
  l2: styles.levelRingL2,
  l3: styles.levelRingL3,
  l4: styles.levelRingL4,
};

export default BadgeScreen;
