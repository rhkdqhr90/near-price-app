import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MyPageScreenProps, MainTabParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { useMyPrices } from '../../hooks/queries/usePrices';
import { useMyWishlist } from '../../hooks/queries/useWishlist';
import MenuItem from '../../components/common/MenuItem';
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
import { userApi } from '../../api/user.api';

type Props = MyPageScreenProps<'MyPage'>;

// ─── 닉네임 변경 모달 ─────────────────────────────────────────────────────

interface NicknameModalProps {
  visible: boolean;
  currentNickname: string;
  onClose: () => void;
  onUpdate: (nickname: string) => Promise<void>;
}

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,6}$/;

const getNicknameError = (nickname: string): string | null => {
  // 공백만으로 이루어진 경우 거부
  if (!nickname || nickname.trim().length === 0) {
    return '닉네임을 입력하세요';
  }

  const trimmedNickname = nickname.trim();

  if (trimmedNickname.length < 2) {
    return '최소 2글자 이상 입력하세요';
  }
  if (trimmedNickname.length > 6) {
    return '최대 6글자까지 입력 가능합니다';
  }
  if (!NICKNAME_REGEX.test(trimmedNickname)) {
    return '한글, 영문, 숫자만 입력 가능합니다';
  }
  return null;
};

const NicknameModal: React.FC<NicknameModalProps> = ({
  visible,
  currentNickname,
  onClose,
  onUpdate,
}) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);

  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeNickname = (text: string) => {
    // 한글 자모(ㄱ-ㅎ, ㅏ-ㅣ) + 완성형(가-힣) + 영문 + 숫자 허용
    // 조합 중인 한글을 허용하기 위해 자모도 포함
    const filteredText = text.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g, '');
    const limitedText = filteredText.slice(0, 6);

    setNickname(limitedText);

    // 입력 중 에러만 바로 표시 (중복 확인은 debounce)
    if (limitedText.length > 0 && limitedText.length < 2) {
      setError('최소 2글자 이상 입력하세요');
    } else {
      setError(null);
    }

    // 중복 확인은 debounce (키보드 안 내려감)
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    if (limitedText.length >= 2 && limitedText !== currentNickname) {
      checkTimerRef.current = setTimeout(async () => {
        // 완성형 한글인지 최종 확인
        if (!/^[가-힣a-zA-Z0-9]{2,6}$/.test(limitedText)) return;
        setCheckingNickname(true);
        try {
          const response = await userApi.checkNicknameAvailable(limitedText);
          if (!response.available) {
            setError('이미 사용 중인 닉네임입니다');
          }
        } catch {
          // 네트워크 에러 무시 (제출 시 다시 확인)
        } finally {
          setCheckingNickname(false);
        }
      }, 500);
    }
  };

  const handleUpdate = async () => {
    const validationError = getNicknameError(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (nickname === currentNickname) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      await onUpdate(nickname);
      onClose();
    } catch (err) {
      console.error('Nickname update error:', err);
      let message = '닉네임 변경에 실패했습니다';

      // axios 에러 처리
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 409) {
          message = '이미 사용 중인 닉네임입니다';
        } else if (response?.status === 400) {
          message = response?.data?.message ?? '유효하지 않은 닉네임입니다';
        } else if (response?.status === 429) {
          message = '너무 빠르게 변경했습니다. 잠시 후 다시 시도해주세요';
        } else if (response?.data?.message) {
          message = response.data.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNickname(currentNickname);
    setError(null);
    setCheckingNickname(false);
    onClose();
  };

  const canSubmit = !error && nickname !== currentNickname && !loading && !checkingNickname;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>닉네임 변경</Text>

          <TextInput
            style={styles.nicknameInput}
            placeholder="새로운 닉네임"
            value={nickname}
            onChangeText={handleChangeNickname}
            maxLength={6}
            autoFocus={true}
            placeholderTextColor={colors.gray400}
            accessibilityLabel="닉네임 입력"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          {checkingNickname && (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.checkingText}>중복 확인 중...</Text>
            </View>
          )}

          <Text style={styles.helperText}>한글, 영문, 숫자 2~6자</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                !canSubmit && styles.disabledButton,
              ]}
              onPress={handleUpdate}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>변경</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── 메인 스크린 ───────────────────────────────────────────────────────────

const MyPageScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const regionName = useLocationStore(s => s.regionName);
  const { data: myPrices, isLoading: isPricesLoading, isError: isPricesError } = useMyPrices();
  const { data: wishlist, isLoading: isWishlistLoading, isError: isWishlistError } = useMyWishlist();

  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);

  // 닉네임이 없거나 빈 문자열인 경우 폴백 처리
  const displayNickname = user?.nickname && user.nickname.trim().length > 0
    ? user.nickname
    : (user?.email?.split('@')[0] ?? '익명');
  const initials = displayNickname?.charAt(0)?.toUpperCase() ?? '?';

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }),
    [insets.bottom],
  );
  const containerStyle = useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );
  const priceCount = useMemo(
    () => isPricesError ? '-' : isPricesLoading ? '...' : String(myPrices?.length ?? 0),
    [myPrices, isPricesLoading, isPricesError],
  );
  const receivedLikes = useMemo(
    () => isPricesError ? '-' : isPricesLoading ? '...' : String((myPrices ?? []).reduce((sum, p) => sum + p.likeCount, 0)),
    [myPrices, isPricesLoading, isPricesError],
  );
  const wishlistCount = useMemo(
    () => isWishlistError ? '-' : isWishlistLoading ? '...' : String(wishlist?.totalCount ?? 0),
    [wishlist, isWishlistLoading, isWishlistError],
  );

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

  const handleNavigateInquiry = useCallback(() => {
    navigation.navigate('Inquiry');
  }, [navigation]);

  const handleNavigateBadge = useCallback(() => {
    navigation.navigate('Badge');
  }, [navigation]);

  const handleLocationChange = useCallback(() => {
    navigation.navigate('LocationSetup', { returnTo: 'mypage' });
  }, [navigation]);

  const handleNotificationSettings = useCallback(() => {
    navigation.navigate('NotificationSettings');
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

  const handleNicknameModalOpen = useCallback(() => {
    setNicknameModalVisible(true);
  }, []);

  const handleNicknameModalClose = useCallback(() => {
    setNicknameModalVisible(false);
  }, []);

  const handleNicknameUpdate = useCallback(
    async (newNickname: string) => {
      if (!user?.id) return;

      const response = await userApi.updateNickname(user.id, {
        nickname: newNickname,
      });

      // store에 닉네임 업데이트
      setUser({
        ...user,
        nickname: response.nickname,
      });

      Alert.alert('성공', '닉네임이 변경되었습니다');
    },
    [user, setUser],
  );

  return (
    <>
      <ScrollView
        style={containerStyle}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. 프로필 영역 */}
        <View style={styles.profileSection}>
          <View style={styles.profileCenter}>
            {user?.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                style={styles.avatarImage}
                accessibilityRole="image"
                accessibilityLabel={`${displayNickname} 프로필 사진`}
              />
            ) : (
              <View style={styles.avatar} accessibilityRole="image" accessibilityLabel={`${displayNickname} 프로필`}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.nickname}>{displayNickname}</Text>
            <View style={styles.profileMeta}>
              <Text style={styles.regionText}>📍 {regionName ?? '동네 미설정'}</Text>
              {user?.trustScore != null && (
                <Text style={styles.trustText}>⭐ 신뢰도 {user.trustScore}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.nicknameEditBtn}
              onPress={handleNicknameModalOpen}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="닉네임 변경"
            >
              <Text style={styles.nicknameEditBtnText}>프로필 편집</Text>
            </TouchableOpacity>
          </View>
        </View>

      <View style={styles.sectionGap} />

      {/* 2. 활동 요약 카드 */}
      <View style={styles.summarySection}>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateMyPriceList}
          accessibilityRole="button"
          accessibilityLabel={`등록한 가격 ${priceCount}개`}
        >
          <Text style={styles.summaryCount}>{priceCount}</Text>
          <Text style={styles.summaryLabel}>등록한 가격</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateLikedPrices}
          accessibilityRole="button"
          accessibilityLabel={`받은 좋아요 ${receivedLikes}개`}
        >
          <Text style={styles.summaryCount}>{receivedLikes}</Text>
          <Text style={styles.summaryLabel}>받은 좋아요</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.7}
          onPress={handleNavigateWishlist}
          accessibilityRole="button"
          accessibilityLabel={`찜한 상품 ${wishlistCount}개`}
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
        />
        <MenuItem
          icon={<DocumentIcon size={20} color={colors.gray700} />}
          label="나의 뱃지"
          onPress={handleNavigateBadge}
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
          onPress={handleNotificationSettings}
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
          onPress={handleNavigateInquiry}
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

      {/* 닉네임 변경 모달 */}
      <NicknameModal
        visible={nicknameModalVisible}
        currentNickname={displayNickname}
        onClose={handleNicknameModalClose}
        onUpdate={handleNicknameUpdate}
      />
    </>
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
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  profileCenter: {
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.white,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  regionText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  trustText: {
    ...typography.bodySm,
    color: colors.accent,
    fontWeight: '600' as const,
  },
  nicknameEditBtn: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.radiusFull,
  },
  nicknameEditBtnText: {
    ...typography.bodySm,
    color: colors.gray700,
    fontWeight: '500' as const,
  },
  trustBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.micro,
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
    borderRadius: spacing.radiusMd,
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

  // 앱 버전
  appVersion: {
    ...typography.bodySm,
    color: colors.cardPriceStrike,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // ─── 모달 ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    padding: spacing.xl,
    width: '85%',
    maxWidth: 320,
  },
  modalTitle: {
    ...typography.headingLg,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkingText: {
    ...typography.bodySm,
    color: colors.gray600,
  },
  helperText: {
    ...typography.caption,
    color: colors.gray600,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.gray700,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default MyPageScreen;
