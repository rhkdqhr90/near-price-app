import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MyPageScreenProps, MainTabParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { useMyPrices } from '../../hooks/queries/usePrices';
import { useMyWishlist } from '../../hooks/queries/useWishlist';
import ChevronRightIcon from '../../components/icons/ChevronRightIcon';
import TagIcon from '../../components/icons/TagIcon';
import HeartIcon from '../../components/icons/HeartIcon';
import BellIcon from '../../components/icons/BellIcon';
import MapPinIcon from '../../components/icons/MapPinIcon';
import LogOutIcon from '../../components/icons/LogOutIcon';
import DocumentIcon from '../../components/icons/DocumentIcon';
import HelpCircleIcon from '../../components/icons/HelpCircleIcon';
import { APP_VERSION } from '../../utils/config';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'MyPage'>;

// ─── 로컬 컴포넌트 ─────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactElement;
  label: string;
  rightLabel?: string;
  onPress: () => void;
  isLast?: boolean;
  isDanger?: boolean;
}

const MenuItem = React.memo<MenuItemProps>(({
  icon,
  label,
  rightLabel,
  onPress,
  isLast = false,
  isDanger = false,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[styles.menuLabel, isDanger && styles.menuLabelDanger]}>
      {label}
    </Text>
    {rightLabel ? (
      <Text style={styles.menuRightLabel} numberOfLines={1}>{rightLabel}</Text>
    ) : null}
    <ChevronRightIcon size={16} color={colors.gray400} />
  </TouchableOpacity>
));

// ─── 메인 스크린 ───────────────────────────────────────────────────────────

const MyPageScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const regionName = useLocationStore(s => s.regionName);
  const { data: myPrices } = useMyPrices();
  const { data: wishlist } = useMyWishlist();

  const initials = user?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + spacing.xxl }),
    [insets.bottom],
  );
  const containerStyle = useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );
  const priceCount = myPrices?.length ?? 0;
  const receivedLikes = useMemo(
    () => (myPrices ?? []).reduce((sum, p) => sum + p.likeCount, 0),
    [myPrices],
  );
  const wishlistCount = wishlist?.totalCount ?? 0;

  const handleNavigateMyPriceList = useCallback(() => {
    navigation.navigate('MyPriceList');
  }, [navigation]);

  const handleNavigateLikedPrices = useCallback(() => {
    navigation.navigate('LikedPrices');
  }, [navigation]);

  const handleNavigateWishlist = useCallback(() => {
    navigation.getParent<BottomTabNavigationProp<MainTabParamList>>()?.navigate('Wishlist');
  }, [navigation]);

  const handleNavigateNoticeList = useCallback(() => {
    navigation.navigate('NoticeList');
  }, [navigation]);

  const handleNavigateFaq = useCallback(() => {
    navigation.navigate('Faq');
  }, [navigation]);

  const handleLocationChange = useCallback(() => {
    navigation.navigate('LocationSetup', { returnTo: 'mypage' });
  }, [navigation]);

  const handleComingSoon = useCallback(() => {
    Alert.alert('준비 중', '곧 제공될 예정이에요.');
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. 프로필 영역 */}
      <View style={styles.profileSection}>
        <Text style={styles.pageTitle}>MY</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname ?? '알 수 없음'}</Text>
            <View style={styles.profileMeta}>
              <Text style={styles.regionText}>
                {regionName ?? '동네 미설정'}
              </Text>
              {user?.trustScore != null ? (
                <View style={styles.trustBadge}>
                  <Text style={styles.trustBadgeText}>
                    신뢰도 {user.trustScore}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionGap} />

      {/* 2. 활동 요약 카드 */}
      <View style={styles.summarySection}>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateMyPriceList}
        >
          <Text style={styles.summaryCount}>{priceCount}</Text>
          <Text style={styles.summaryLabel}>등록한 가격</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateLikedPrices}
        >
          <Text style={styles.summaryCount}>{receivedLikes}</Text>
          <Text style={styles.summaryLabel}>받은 좋아요</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateWishlist}
        >
          <Text style={styles.summaryCount}>{wishlistCount}</Text>
          <Text style={styles.summaryLabel}>찜한 상품</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionGap} />

      {/* 3. 나의 활동 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>나의 활동</Text>
        <MenuItem
          icon={<TagIcon size={20} color={colors.gray700} />}
          label="내가 등록한 가격"
          onPress={handleNavigateMyPriceList}
        />
        <MenuItem
          icon={<HeartIcon size={20} color={colors.gray700} />}
          label="좋아요한 가격"
          onPress={handleNavigateLikedPrices}
          isLast
        />
      </View>

      <View style={styles.sectionGap} />

      {/* 4. 설정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>설정</Text>
        <MenuItem
          icon={<MapPinIcon size={20} color={colors.gray700} />}
          label="내 동네 설정"
          rightLabel={regionName ?? '미설정'}
          onPress={handleLocationChange}
        />
        <MenuItem
          icon={<BellIcon size={20} color={colors.gray700} />}
          label="알림 설정"
          onPress={handleComingSoon}
        />
        <MenuItem
          icon={<DocumentIcon size={20} color={colors.gray700} />}
          label="공지사항"
          onPress={handleNavigateNoticeList}
        />
        <MenuItem
          icon={<LogOutIcon size={20} color={colors.gray700} />}
          label="로그아웃"
          onPress={handleLogout}
          isLast
          isDanger
        />
      </View>

      <View style={styles.sectionGap} />

      {/* 5. 기타 섹션 */}
      <View style={styles.section}>
        <MenuItem
          icon={<HelpCircleIcon size={20} color={colors.gray700} />}
          label="도움말 / 문의"
          onPress={handleNavigateFaq}
        />
        <MenuItem
          icon={<DocumentIcon size={20} color={colors.gray700} />}
          label="이용약관 / 개인정보"
          onPress={handleComingSoon}
          isLast
        />
      </View>

      <Text style={styles.appVersion}>v{APP_VERSION}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },

  // 프로필
  profileSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    ...typography.headingXl,
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.headingXl,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    ...typography.headingLg,
    marginBottom: spacing.xs,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  regionText: {
    ...typography.bodySm,
  },
  trustBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  trustBadgeText: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.primary,
  },

  // 섹션 구분
  sectionGap: {
    height: spacing.sm,
    backgroundColor: colors.gray100,
  },

  // 활동 요약
  summarySection: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  summaryCount: {
    ...typography.activityCount,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySm,
  },

  // 섹션
  section: {
    backgroundColor: colors.white,
  },
  sectionHeader: {
    ...typography.tagText,
    color: colors.gray600,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // 메뉴 아이템
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.inputPad,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
    minHeight: 52,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    ...typography.headingMd,
    flex: 1,
  },
  menuLabelDanger: {
    color: colors.danger,
  },
  menuRightLabel: {
    ...typography.bodySm,
    maxWidth: 120,
  },

  // 앱 버전
  appVersion: {
    ...typography.bodySm,
    color: colors.cardPriceStrike,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default MyPageScreen;
