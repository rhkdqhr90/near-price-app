import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { useNotificationStore } from '../../store/notificationStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'NotificationSettings'>;

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const allNotifications = useNotificationStore(s => s.allNotifications);
  const priceChangeNotification = useNotificationStore(s => s.priceChangeNotification);
  const promotionNotification = useNotificationStore(s => s.promotionNotification);
  const setAllNotifications = useNotificationStore(s => s.setAllNotifications);
  const setPriceChangeNotification = useNotificationStore(s => s.setPriceChangeNotification);
  const setPromotionNotification = useNotificationStore(s => s.setPromotionNotification);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: '알림 설정',
      headerTitleStyle: {
        ...typography.headingMd,
      },
    });
  }, [navigation]);

  const handleAllNotificationsChange = useCallback(async (value: boolean) => {
    setIsLoading(true);
    try {
      // 실제 기기 알림 권한 확인 (추후 구현 가능)
      // iOS/Android 권한 API 연동 시 여기에 추가
      setAllNotifications(value);

      if (!value) {
        Alert.alert('알림이 꺼졌습니다', '알림 설정에서 다시 켤 수 있습니다.');
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      Alert.alert('오류', '알림 설정을 변경할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [setAllNotifications]);

  const handlePriceChangeChange = useCallback((value: boolean) => {
    if (!allNotifications) return;
    setPriceChangeNotification(value);
  }, [allNotifications, setPriceChangeNotification]);

  const handlePromotionChange = useCallback((value: boolean) => {
    setPromotionNotification(value);
  }, [setPromotionNotification]);

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
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* 전단지/할인 알림 섹션 */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>
              전단지/할인 알림
            </Text>
            <Text style={styles.settingDescription}>
              준비 중입니다 🚀
            </Text>
          </View>
          <Switch
            value={promotionNotification}
            onValueChange={handlePromotionChange}
            disabled={true}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={promotionNotification ? colors.primary : colors.gray400}
            style={styles.switch}
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
