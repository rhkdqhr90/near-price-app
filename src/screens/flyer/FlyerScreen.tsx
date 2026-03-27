import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FlyerScreenProps } from '../../navigation/types';
import { useFlyers, useOwnerPosts } from '../../hooks/queries/useFlyers';
import type { FlyerResponse, OwnerPostResponse } from '../../types/api.types';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorView from '../../components/common/ErrorView';
import TagIcon from '../../components/icons/TagIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = FlyerScreenProps<'FlyerList'>;

const SCREEN_W = Dimensions.get('window').width;
const FLYER_CARD_W = Math.round(SCREEN_W * 0.74);
const FLYER_IMAGE_H = Math.round(FLYER_CARD_W * 1.2);

// ─── Sub-components ───────────────────────────────────────────────────────────

const FlyerCard: React.FC<{ item: FlyerResponse; onPress: (id: string) => void }> = ({ item, onPress }) => {
  const handlePress = React.useCallback(() => onPress(item.id), [onPress, item.id]);
  return (
    <TouchableOpacity
      style={styles.flyerCard}
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${item.storeName} ${item.promotionTitle} 전단지 상세보기`}
    >
      <View style={[styles.flyerImage, { backgroundColor: item.bgColor }]}>
        <Text style={styles.flyerEmoji}>{item.emoji}</Text>
        <View style={[styles.flyerBadge, { backgroundColor: item.badgeColor }]}>
          <Text style={styles.flyerBadgeText}>{item.badge}</Text>
        </View>
      </View>
      <View style={styles.flyerBody}>
        <Text style={styles.flyerTitle} numberOfLines={1}>
          {item.storeName} {item.promotionTitle}
        </Text>
        <View style={styles.flyerMeta}>
          <Text style={styles.flyerMetaIcon}>📅</Text>
          <Text style={styles.flyerMetaText} numberOfLines={1}>{item.dateRange}</Text>
        </View>
        <View style={styles.flyerMeta}>
          <Text style={styles.flyerMetaIcon}>🛒</Text>
          <Text style={[styles.flyerMetaText, styles.flyerMetaBold]} numberOfLines={1}>
            {item.highlight}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const OwnerPostCard: React.FC<{ post: OwnerPostResponse }> = ({ post }) => (
  <View style={styles.ownerCard}>
    <View style={styles.ownerAvatarWrap}>
      <View style={styles.ownerAvatar}>
        <Text style={styles.ownerAvatarEmoji}>{post.emoji}</Text>
      </View>
    </View>
    <View style={styles.ownerContent}>
      <View style={styles.ownerNameRow}>
        <Text style={styles.ownerName}>{post.ownerName}</Text>
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>{post.badge}</Text>
        </View>
      </View>
      <View style={styles.bubble}>
        <View style={styles.bubbleTail} />
        <Text style={styles.bubbleText}>{post.message}</Text>
      </View>
      <View style={styles.ownerActions}>
        <TouchableOpacity
          style={styles.ownerActionBtn}
          accessibilityRole="button"
          accessibilityLabel="문의하기"
        >
          <Text style={styles.ownerActionIcon}>💬</Text>
          <Text style={styles.ownerActionLabel}>문의하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ownerActionBtn}
          accessibilityRole="button"
          accessibilityLabel={`좋아요 ${post.likeCount}`}
        >
          <Text style={styles.ownerActionIcon}>🤍</Text>
          <Text style={styles.ownerActionCountLabel}>{post.likeCount.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const FlyerScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: flyers, isLoading: isFlyersLoading, isError: isFlyersError, refetch: refetchFlyers } = useFlyers();
  const { data: ownerPosts, isLoading: isPostsLoading, refetch: refetchPosts } = useOwnerPosts();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const scrollContentStyle = React.useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl * 2 }),
    [insets.bottom],
  );

  const handleFlyerPress = useCallback((flyerId: string) => {
    navigation.navigate('FlyerDetail', { flyerId });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchFlyers(), refetchPosts()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchFlyers, refetchPosts]);

  const isLoading = isFlyersLoading || isPostsLoading;

  const listHeader = useMemo(() => (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>전단지</Text>
        <Text style={styles.headerSub}>우리 동네 마트의 최신 소식</Text>
      </View>

      {/* ── 섹션 1: 디지털 전단지 ─────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>디지털 전단지</Text>
          <Text style={styles.sectionSub}>이번 주 우리 동네 특가</Text>
        </View>
      </View>

      {isFlyersError ? (
        <ErrorView message="전단지를 불러오지 못했습니다." onRetry={refetchFlyers} />
      ) : !flyers || flyers.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="등록된 전단지가 없어요"
          subtitle="곧 동네 마트 전단지가 업데이트될 예정이에요"
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flyerScroll}
          snapToInterval={FLYER_CARD_W + spacing.md}
          decelerationRate="fast"
        >
          {flyers.map((item) => (
            <FlyerCard key={item.id} item={item} onPress={handleFlyerPress} />
          ))}
        </ScrollView>
      )}

      {/* ── 섹션 2: 동네 사장님 추천 헤더 ──────────────────────── */}
      {ownerPosts && ownerPosts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>동네 사장님 추천</Text>
        </View>
      )}
    </>
  ), [flyers, isFlyersError, ownerPosts, refetchFlyers, handleFlyerPress]);

  const renderOwnerPost = useCallback(
    ({ item }: ListRenderItemInfo<OwnerPostResponse>) => (
      <View style={styles.ownerPostItem}>
        <OwnerPostCard post={item} />
      </View>
    ),
    [],
  );

  if (isLoading) {
    return <SkeletonCard variant="price" />;
  }

  return (
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={scrollContentStyle}
      data={ownerPosts ?? []}
      keyExtractor={(item) => item.id}
      renderItem={renderOwnerPost}
      ListHeaderComponent={listHeader}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ──
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.headingXl,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headerSub: {
    ...typography.bodySm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },

  // ── Section Layout ──
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.headingLg,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  sectionSub: {
    ...typography.bodySm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },

  // ── Flyer Cards ──
  flyerScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  flyerCard: {
    width: FLYER_CARD_W,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: spacing.shadowOffsetY },
    shadowOpacity: 0.07,
    shadowRadius: spacing.shadowRadiusLg,
    elevation: 3,
  },
  flyerImage: {
    width: '100%',
    height: FLYER_IMAGE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerEmoji: {
    fontSize: 64,
  },
  flyerBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  flyerBadgeText: {
    ...typography.captionBold,
    color: colors.white,
    fontSize: 10,
  },
  flyerBody: {
    padding: spacing.cardPadH,
    gap: spacing.cardTextGap,
  },
  flyerTitle: {
    ...typography.headingMd,
    marginBottom: spacing.xs,
  },
  flyerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flyerMetaIcon: {
    fontSize: spacing.iconXs,
  },
  flyerMetaText: {
    ...typography.caption,
    color: colors.gray600,
    flex: 1,
  },
  flyerMetaBold: {
    fontWeight: '500' as const,
    color: colors.gray700,
  },

  // ── Owner Post ──
  ownerPostItem: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  ownerAvatarWrap: {
    borderRadius: spacing.radiusFull,
    borderWidth: spacing.borderMedium,
    borderColor: colors.primaryLight,
    padding: 2,
  },
  ownerAvatar: {
    width: 52,
    height: 52,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarEmoji: {
    fontSize: 26,
  },
  ownerContent: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ownerName: {
    ...typography.headingMd,
    fontSize: 14,
  },
  ownerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ownerBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  bubble: {
    backgroundColor: colors.surfaceBg,
    borderRadius: spacing.radiusMd,
    borderTopLeftRadius: spacing.radiusSm,
    padding: spacing.md,
  },
  bubbleTail: {
    position: 'absolute',
    top: 0,
    left: -spacing.sm,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: spacing.sm,
    borderBottomWidth: spacing.sm,
    borderRightColor: colors.surfaceBg,
    borderBottomColor: 'transparent',
  },
  bubbleText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.gray900,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingLeft: spacing.xs,
  },
  ownerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ownerActionIcon: {
    fontSize: 14,
  },
  ownerActionLabel: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  ownerActionCountLabel: {
    ...typography.bodySm,
    color: colors.gray600,
    fontWeight: '600' as const,
  },

});

export default FlyerScreen;
