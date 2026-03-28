import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NearbyStoreResponse } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import MapPinIcon from '../icons/MapPinIcon';
import StoreIcon from '../icons/StoreIcon';

interface Props {
  store: NearbyStoreResponse;
  onConfirm: (store: NearbyStoreResponse) => void;
  onDismiss: () => void;
}

const DetectedStoreSheet: React.FC<Props> = ({ store, onConfirm, onDismiss }) => {
  const insets = useSafeAreaInsets();
  return (
  <View style={[styles.modal, styles.modalContainer]}>
    <View style={[styles.detectedWrap, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}>
      <View style={styles.detectedTop}>
        <MapPinIcon size={18} color={colors.primary} />
        <Text style={styles.detectedLabel}>바로 여기 있어요</Text>
      </View>
      <View style={styles.detectedCard}>
        <View style={styles.detectedIconBox}>
          <StoreIcon size={22} color={colors.primary} />
        </View>
        <View style={styles.detectedInfo}>
          <Text style={styles.detectedName} numberOfLines={1}>{store.name}</Text>
          <Text style={styles.detectedAddress} numberOfLines={1}>{store.address}</Text>
          <Text style={styles.detectedDist}>{store.distance}m 거리</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => onConfirm(store)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${store.name} 선택`}>
        <Text style={styles.primaryBtnText}>여기에요!</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ghostBtn}
        onPress={onDismiss}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="다른 매장 검색">
        <Text style={styles.ghostBtnText}>다른 매장이에요</Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    backgroundColor: colors.modalOverlay,
  },
  detectedWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusMd,
    borderTopRightRadius: spacing.radiusMd,
  },
  detectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detectedLabel: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusMd,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  detectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedInfo: {
    flex: 1,
  },
  detectedName: {
    ...typography.headingMd,
    marginBottom: spacing.micro,
  },
  detectedAddress: {
    ...typography.bodySm,
    marginBottom: spacing.micro,
  },
  detectedDist: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.headingMd,
    color: colors.white,
  },
  ghostBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostBtnText: {
    ...typography.tagText,
    color: colors.gray600,
  },
});

export default DetectedStoreSheet;
