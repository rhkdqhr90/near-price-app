import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import { usePriceRegisterStore } from '../../store/priceRegisterStore';
import CameraIcon from '../../components/icons/CameraIcon';
import EditIcon from '../../components/icons/EditIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = PriceRegisterScreenProps<'InputMethod'>;

const InputMethodScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const storeName = usePriceRegisterStore(s => s.storeName);

  const handleCamera = useCallback(() => {
    navigation.navigate('Camera');
  }, [navigation]);

  const handleManual = useCallback(() => {
    navigation.navigate('ItemDetail', {});
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.storeLabel}>선택한 매장</Text>
        <Text style={styles.storeName} numberOfLines={1}>{storeName ?? ''}</Text>
      </View>

      <Text style={styles.title}>어떻게 등록할까요?</Text>

      <View style={styles.cards}>
        <TouchableOpacity style={styles.methodCard} onPress={handleCamera} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="사진으로 등록">
          <View style={styles.iconWrap}>
            <CameraIcon size={32} color={colors.primary} />
          </View>
          <Text style={styles.methodTitle}>사진으로 등록</Text>
          <Text style={styles.methodDesc}>가격표를 촬영하면{'\n'}자동으로 인식해요</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.methodCard} onPress={handleManual} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="직접 입력">
          <View style={styles.iconWrap}>
            <EditIcon size={32} color={colors.primary} />
          </View>
          <Text style={styles.methodTitle}>직접 입력</Text>
          <Text style={styles.methodDesc}>상품명과 가격을{'\n'}직접 입력해요</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  storeLabel: { ...typography.bodySm, fontWeight: '500' as const, color: colors.gray600, marginBottom: spacing.micro },
  storeName: { ...typography.headingMd },
  title: { ...typography.headingXl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl + spacing.lg + spacing.md, paddingBottom: spacing.lg },
  cards: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.md },
  methodCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: spacing.radiusLg,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  iconWrap: {
    width: spacing.cameraControlSize + spacing.md + spacing.md,
    height: spacing.cameraControlSize + spacing.md + spacing.md,
    borderRadius: spacing.radiusLg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md + spacing.sm,
  },
  methodTitle: { ...typography.headingMd, marginBottom: spacing.sm, textAlign: 'center' },
  methodDesc: { ...typography.bodySm, textAlign: 'center', lineHeight: spacing.xl },
});

export default InputMethodScreen;
