import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../store/onboardingStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import MapPinIcon from '../../components/icons/MapPinIcon';
import CameraIcon from '../../components/icons/CameraIcon';
import BellIcon from '../../components/icons/BellIcon';

interface PermissionConfig {
  key: 'location' | 'camera' | 'notification';
  title: string;
  description: string;
  required: boolean;
  Icon: React.FC<{ size?: number; color?: string }>;
}

const PERMISSION_LIST: PermissionConfig[] = [
  {
    key: 'location',
    title: '위치',
    description: '내 주변 매장 가격을 확인해요',
    required: true,
    Icon: MapPinIcon,
  },
  {
    key: 'camera',
    title: '카메라',
    description: '가격표를 촬영해서 자동으로 등록해요',
    required: true,
    Icon: CameraIcon,
  },
  {
    key: 'notification',
    title: '알림',
    description: '내 동네 가격 변동 소식을 받아요',
    required: false,
    Icon: BellIcon,
  },
];

const ICON_SIZE = 48;
const ICON_BOX = 56;
const ICON_RADIUS = 16;

const requestAndroidPermission = async (config: PermissionConfig): Promise<void> => {
  if (config.key === 'notification') return;

  const permission =
    config.key === 'location'
      ? PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      : PermissionsAndroid.PERMISSIONS.CAMERA;

  const result = await PermissionsAndroid.request(permission);

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    await new Promise<void>((resolve) => {
      Alert.alert(
        `${config.title} 권한 필요`,
        '설정에서 권한을 허용해 주세요.',
        [
          { text: '취소', style: 'cancel', onPress: () => resolve() },
          {
            text: '설정으로 이동',
            onPress: () => {
              Linking.openSettings();
              resolve();
            },
          },
        ],
      );
    });
  }
};

const PermissionScreen: React.FC = () => {
  const { markOnboardingSeen } = useOnboardingStore();
  const insets = useSafeAreaInsets();

  const handleAllow = useCallback(async () => {
    if (Platform.OS === 'android') {
      for (const p of PERMISSION_LIST) {
        await requestAndroidPermission(p);
      }
    }
    // iOS: 각 기능 첫 사용 시 시스템이 직접 요청
    markOnboardingSeen();
  }, [markOnboardingSeen]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>앱 사용에 필요한{'\n'}권한을 허용해 주세요</Text>
        <Text style={styles.subtitle}>허용하지 않아도 앱을 사용할 수 있어요</Text>

        <View style={styles.list}>
          {PERMISSION_LIST.map((item) => {
            const { Icon } = item;
            return (
              <View key={item.key} style={styles.item}>
                <View style={styles.iconBox}>
                  <Icon size={ICON_SIZE / 2} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {!item.required && (
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalText}>선택</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: spacing.xl + spacing.lg + insets.bottom }]}>
        <TouchableOpacity style={styles.allowButton} onPress={handleAllow} activeOpacity={0.8}>
          <Text style={styles.allowButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.xl,
  },
  title: {
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
    marginBottom: spacing.xxl,
  },
  list: {
    gap: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_RADIUS,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: spacing.micro,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTitle: {
    ...typography.headingMd,
  },
  optionalBadge: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
  },
  optionalText: {
    ...typography.captionBold,
    color: colors.gray600,
  },
  itemDescription: {
    ...typography.body,
    color: colors.gray600,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg, // + insets.bottom (동적으로 추가됨)
  },
  allowButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  allowButtonText: {
    ...typography.headingLg,
    color: colors.white,
  },
});

export default PermissionScreen;
