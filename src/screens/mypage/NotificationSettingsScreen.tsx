import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettings,
} from '../../hooks/queries/useNotificationSettings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'NotificationSettings'>;

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const allNotifications = useNotificationStore((s) => s.allNotifications);
  const priceChangeNotification = useNotificationStore((s) => s.priceChangeNotification);
  const promotionNotification = useNotificationStore((s) => s.promotionNotification);
  const setAllNotifications = useNotificationStore((s) => s.setAllNotifications);
  const setPriceChangeNotification = useNotificationStore((s) => s.setPriceChangeNotification);
  const setPromotionNotification = useNotificationStore((s) => s.setPromotionNotification);

  // 서버에서 최신 설정 동기화 (onSuccess에서 syncFromServer 호출)
  const { isLoading: isQueryLoading } = useNotificationSettingsQuery(user?.id);
  const { mutate: updateSettings, isPending } = useUpdateNotificationSettings(user?.id);

  const isLoading = isQueryLoading || isPending;

  useEffect(() => {
    navigation.setOptions({
      title: '알림 설정',
      headerTitleStyle: {
        ...typography.headingMd,
      },
    });
  }, [navigation]);

  // 화면 포커스 시 OS 권한 상태 재확인 (기기 설정에서 돌아왔을 때 반영)
  useFocusEffect(
    useCallback(() => {
      messaging().hasPermission().then((status) => {
        const isOsGranted =
          status === messaging.AuthorizationStatus.AUTHORIZED ||
          status === messaging.AuthorizationStatus.PROVISIONAL;
        // OS 권한 거부인데 앱은 ON → 앱도 OFF로 강제 동기화
        if (!isOsGranted && allNotifications) {
          setAllNotifications(false);
          updateSettings({ notifPriceChange: false, notifPromotion: false });
        }
      });
    }, [allNotifications, setAllNotifications, updateSettings]),
  );

  const handleAllNotificationsChange = useCallback(async (value: boolean) => {
    if (value) {
      // 켜기: OS 권한 확인 먼저
      const status = await messaging().hasPermission();
      const isOsGranted =
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL;

      if (!isOsGranted) {
        // OS 권한 없음 → 기기 설정으로 이동 안내
        Alert.alert(
          '알림 권한이 필요해요',
          '기기 설정에서 알림을 허용해야 알림을 받을 수 있어요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }

    setAllNotifications(value);
    updateSettings(
      { notifPriceChange: value, notifPromotion: value ? promotionNotification : false },
      {
        onError: () => {
          setAllNotifications(!value);
          Alert.alert('오류', '알림 설정을 변경할 수 없습니다.');
        },
        onSuccess: () => {
          if (!value) {
            Alert.alert(
              '앱 알림이 꺼졌습니다',
              '기기 알림도 끄려면 기기 설정에서 변경하세요.',
              [
                { text: '확인' },
                { text: '기기 설정', onPress: () => Linking.openSettings() },
              ],
            );
          }
        },
      },
    );
  }, [promotionNotification, setAllNotifications, updateSettings]);

  const handlePriceChangeChange = useCallback((value: boolean) => {
    if (!allNotifications) return;
    setPriceChangeNotification(value);
    updateSettings(
      { notifPriceChange: value },
      {
        onError: () => {
          setPriceChangeNotification(!value);
        },
      },
    );
  }, [allNotifications, setPriceChangeNotification, updateSettings]);

  const handlePromotionChange = useCallback((value: boolean) => {
    if (!allNotifications) return;
    setPromotionNotification(value);
    updateSettings(
      { notifPromotion: value },
      {
        onError: () => {
          setPromotionNotification(!value);
        },
      },
    );
  }, [allNotifications, setPromotionNotification, updateSettings]);

  const containerStyle = React.useMemo(
    () => [styles.container, { paddingTop: insets.top }],
    [insets.top],
  );

  const contentStyle = React.useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }),
    [insets.bottom],
  );

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {/* 전체 알림 섹션 */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>전체 알림</Text>
            <Text style={styles.settingDescription}>
              모든 알림을 수신합니다
            </Text>
          </View>
          <Switch
            value={allNotifications}
            onValueChange={handleAllNotificationsChange}
            disabled={isLoading}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={allNotifications ? colors.primary : colors.gray400}
            style={styles.switch}
            accessibilityRole="switch"
            accessibilityLabel="전체 알림"
            accessibilityState={{ checked: allNotifications, disabled: isLoading }}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* 가격 변동 알림 섹션 */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingLabel,
              !allNotifications && styles.disabledText,
            ]}>
              가격 변동 알림
            </Text>
            <Text style={[
              styles.settingDescription,
              !allNotifications && styles.disabledText,
            ]}>
              관심 상품의 가격 변동 시 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={priceChangeNotification}
            onValueChange={handlePriceChangeChange}
            disabled={!allNotifications || isLoading}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={priceChangeNotification ? colors.primary : colors.gray400}
            style={styles.switch}
            accessibilityRole="switch"
            accessibilityLabel="가격 변동 알림"
            accessibilityState={{ checked: priceChangeNotification, disabled: !allNotifications || isLoading }}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* 전단지/할인 알림 섹션 */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingLabel,
              !allNotifications && styles.disabledText,
            ]}>
              전단지/할인 알림
            </Text>
            <Text style={[
              styles.settingDescription,
              !allNotifications && styles.disabledText,
            ]}>
              동네 마트 전단지 업데이트 시 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={promotionNotification}
            onValueChange={handlePromotionChange}
            disabled={!allNotifications || isLoading}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={promotionNotification ? colors.primary : colors.gray400}
            style={styles.switch}
            accessibilityRole="switch"
            accessibilityLabel="전단지/할인 알림"
            accessibilityState={{ checked: promotionNotification, disabled: !allNotifications || isLoading }}
          />
        </View>
      </View>

      {/* 정보 텍스트 */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          • 알림은 앱이 백그라운드에 있을 때도 수신됩니다
        </Text>
        <Text style={styles.infoText}>
          • 기기의 알림 설정에서 알림을 추가로 제어할 수 있습니다
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },

  section: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },

  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },

  settingLabel: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.black,
    marginBottom: spacing.xs,
  },

  settingDescription: {
    ...typography.bodySm,
    color: colors.gray600,
  },

  disabledText: {
    color: colors.gray400,
  },

  switch: {
    marginLeft: spacing.md,
  },

  divider: {
    height: spacing.xs,
    backgroundColor: colors.gray100,
  },

  infoSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  infoText: {
    ...typography.bodySm,
    color: colors.gray600,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
