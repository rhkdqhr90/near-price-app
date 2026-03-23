import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { badgeApi } from '../../api/badge.api';
import type { UserBadgesResponse } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';

type Props = MyPageScreenProps<'Badge'>;

interface BadgeGridItem {
  type: string;
  name: string;
  icon: string;
  category: 'registration' | 'verification' | 'trust';
  isEarned: boolean;
  description: string;
  earnedAt?: string;
  current?: number;
  threshold?: number;
}

const BADGE_DESCRIPTIONS: Record<string, string> = {
  'first_registration': '첫 가격 등록',
  'active_registerer': '활발한 등록자',
  'price_master': '가격 마스터',
  'first_verification': '첫 검증 완료',
  'verification_expert': '검증 전문가',
  'verification_master': '검증 마스터',
  'trusted_user': '신뢰받는 사용자',
  'highest_trust': '최고 신뢰도 사용자',
};

const BadgeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const [badgesData, setBadgesData] = useState<UserBadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user?.id) {
        setError('사용자 정보가 없습니다');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await badgeApi.getUserBadges(user.id);
        setBadgesData(response);
      } catch (err) {
        console.error('배지 조회 에러:', err);
        let message = '배지를 불러올 수 없습니다';
        if (err && typeof err === 'object' && 'message' in err) {
          message = (err as Error).message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user?.id]);

  const handleRetry = () => {
    setError(null);
    const fetchBadges = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const response = await badgeApi.getUserBadges(user.id);
        setBadgesData(response);
      } catch (err) {
        console.error('배지 조회 에러:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  };

  const getBadgeGridItems = (): BadgeGridItem[] => {
    if (!badgesData) return [];

    const allBadges: BadgeGridItem[] = [];

    // 획득한 뱃지 추가
    badgesData.earned.forEach(badge => {
      allBadges.push({
        type: badge.type,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        isEarned: true,
        description: BADGE_DESCRIPTIONS[badge.type] || badge.name,
        earnedAt: badge.earnedAt,
      });
    });

    // 진행 중인 뱃지 추가
    badgesData.progress.forEach(badge => {
      allBadges.push({
        type: badge.type,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        isEarned: false,
        description: BADGE_DESCRIPTIONS[badge.type] || badge.name,
        current: badge.current,
        threshold: badge.threshold,
      });
    });

    // 카테고리별로 정렬
    return allBadges.sort((a, b) => {
      const categoryOrder = { registration: 0, verification: 1, trust: 2 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });
  };

  const getActivityStats = () => {
    if (!badgesData) return { registrations: 0, verifications: 0, trustScore: user?.trustScore ?? 0 };

    let registrations = 0;
    let verifications = 0;

    // 진행 중 배지에서 최대값 찾기
    badgesData.progress.forEach(badge => {
      if (badge.category === 'registration') {
        registrations = Math.max(registrations, badge.current);
      } else if (badge.category === 'verification') {
        verifications = Math.max(verifications, badge.current);
      }
    });

    // 획득한 뱃지 기반 추정
    badgesData.earned.forEach(badge => {
      if (badge.type === 'price_master') registrations = Math.max(registrations, 50);
      else if (badge.type === 'active_registerer') registrations = Math.max(registrations, 10);
      else if (badge.type === 'first_registration') registrations = Math.max(registrations, 1);

      if (badge.type === 'verification_master') verifications = Math.max(verifications, 100);
      else if (badge.type === 'verification_expert') verifications = Math.max(verifications, 20);
      else if (badge.type === 'first_verification') verifications = Math.max(verifications, 1);
    });

    return {
      registrations,
      verifications,
      trustScore: user?.trustScore ?? 0,
    };
  };

  const badgeItems = getBadgeGridItems();
  const stats = getActivityStats();
  const earnedCount = badgesData?.earned.length ?? 0;
  const totalCount = (badgesData?.earned.length ?? 0) + (badgesData?.progress.length ?? 0);

  const containerStyle = React.useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );

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
        contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}
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

        {/* 뱃지 보유 현황 */}
        <View style={styles.badgeCountSection}>
          <Text style={styles.badgeCountText}>
            <Text style={styles.badgeCountHighlight}>{earnedCount}</Text>
            {' / '}
            <Text>{totalCount}</Text>
          </Text>
          <Text style={styles.badgeCountSubtext}>뱃지 획득</Text>
        </View>

        {/* 로딩 상태 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>배지를 불러오는 중...</Text>
          </View>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 뱃지 그리드 */}
        {!loading && !error && badgeItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 뱃지가 없습니다</Text>
            <Text style={styles.emptySubtext}>가격 등록과 검증을 통해 뱃지를 획득해보세요!</Text>
          </View>
        )}

        {!loading && !error && badgeItems.length > 0 && (
          <View style={styles.badgeGrid}>
            {badgeItems.map((badge, index) => (
              <TouchableOpacity
                key={`${badge.type}-${index}`}
                style={[
                  styles.badgeItem,
                  !badge.isEarned && styles.badgeItemInactive,
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    !badge.isEarned && styles.badgeIconContainerInactive,
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>

                {badge.isEarned ? (
                  <Text style={styles.badgeEarnedText}>획득함</Text>
                ) : (
                  <View style={styles.badgeProgressContainer}>
                    <View style={styles.badgeProgressBar}>
                      <View
                        style={[
                          styles.badgeProgressFill,
                          {
                            width: `${Math.min(
                              ((badge.current ?? 0) / (badge.threshold ?? 1)) * 100,
                              100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.badgeProgressText}>
                      {badge.current} / {badge.threshold}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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
    width: 24,
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

  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.gray600,
    marginTop: spacing.lg,
  },

  // 에러
  errorContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.white,
  },

  // 빈 상태
  emptyContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    paddingVertical: spacing.xxxl,
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
    borderColor: colors.gray300,
    opacity: 0.6,
  },

  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeIconContainerInactive: {
    backgroundColor: colors.gray200,
  },
  badgeIcon: {
    fontSize: 28,
  },

  badgeName: {
    ...typography.bodySm,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: colors.primary,
  },

  badgeProgressContainer: {
    width: '100%',
    gap: spacing.xs,
  },
  badgeProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
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

export default BadgeScreen;
