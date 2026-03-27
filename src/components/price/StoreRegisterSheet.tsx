import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { StoreType } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface StoreTypeOption {
  label: string;
  value: StoreType;
  isDefault: boolean;
}

interface Props {
  storeName: string;
  onChangeStoreName: (name: string) => void;
  storeAddress: string;
  onChangeStoreAddress: (address: string) => void;
  storeType: StoreType;
  onChangeStoreType: (type: StoreType) => void;
  storeTypes: StoreTypeOption[];
  errors: { name?: string; address?: string };
  onClearError: (field: 'name' | 'address') => void;
  showAddStoreType: boolean;
  onToggleAddStoreType: (show: boolean) => void;
  newStoreTypeInput: string;
  onChangeNewStoreTypeInput: (value: string) => void;
  onAutoFillAddress: () => void;
  onAddStoreType: () => void;
  onRegister: () => void;
  onBack: () => void;
  isCreating: boolean;
}

const StoreRegisterSheet: React.FC<Props> = ({
  storeName,
  onChangeStoreName,
  storeAddress,
  onChangeStoreAddress,
  storeType,
  onChangeStoreType,
  storeTypes,
  errors,
  onClearError,
  showAddStoreType,
  onToggleAddStoreType,
  newStoreTypeInput,
  onChangeNewStoreTypeInput,
  onAutoFillAddress,
  onAddStoreType,
  onRegister,
  onBack,
  isCreating,
}) => (
  <View style={[styles.modal, styles.modalContainer]}>
    <View style={styles.registerWrap}>
      <TouchableOpacity
        style={styles.registerBack}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="목록으로 돌아가기">
        <Text style={styles.registerBackText}>← 목록으로</Text>
      </TouchableOpacity>
      <Text style={styles.registerTitle}>새 매장 등록</Text>

      <Text style={styles.fieldLabel}>매장명 *</Text>
      <TextInput
        style={[styles.fieldInput, errors.name ? styles.fieldInputError : undefined]}
        value={storeName}
        onChangeText={(v) => {
          onChangeStoreName(v);
          if (v.trim()) onClearError('name');
        }}
        placeholder="예: 우리마트 광교점"
        placeholderTextColor={colors.gray400}
        accessibilityLabel="매장명"
        accessibilityHint="새 매장 이름을 입력하세요"
      />
      {errors.name ? (
        <Text style={styles.fieldErrorText}>{errors.name}</Text>
      ) : null}

      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>주소 *</Text>
        <TouchableOpacity
          onPress={onAutoFillAddress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="GPS로 주소 자동 채우기">
          <Text style={styles.fieldAutoFillBtn}>GPS로 자동 채우기</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.fieldInput, errors.address ? styles.fieldInputError : undefined]}
        value={storeAddress}
        onChangeText={(v) => {
          onChangeStoreAddress(v);
          if (v.trim()) onClearError('address');
        }}
        placeholder="예: 서울 강남구 테헤란로 123"
        placeholderTextColor={colors.gray400}
        accessibilityLabel="주소"
        accessibilityHint="매장 주소를 입력하세요"
      />
      {errors.address ? (
        <Text style={styles.fieldErrorText}>{errors.address}</Text>
      ) : null}

      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>매장 유형</Text>
        {!showAddStoreType && (
          <TouchableOpacity
            onPress={() => onToggleAddStoreType(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="새 카테고리 추가">
            <Text style={styles.fieldAutoFillBtn}>+ 추가</Text>
          </TouchableOpacity>
        )}
      </View>
      {showAddStoreType && (
        <View style={styles.addCategorySection}>
          <TextInput
            style={styles.fieldInput}
            value={newStoreTypeInput}
            onChangeText={onChangeNewStoreTypeInput}
            placeholder="예: 약국, 편의마트, 백화점"
            placeholderTextColor={colors.gray400}
            accessibilityLabel="새 카테고리명"
            accessibilityHint="새 카테고리 이름을 입력하세요"
          />
          <View style={styles.addCategoryBtnRow}>
            <TouchableOpacity
              style={[styles.addCategoryBtn, styles.addCategoryBtnConfirm]}
              onPress={onAddStoreType}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="카테고리 추가">
              <Text style={styles.addCategoryBtnText}>추가</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addCategoryBtn, styles.addCategoryBtnCancel]}
              onPress={() => {
                onToggleAddStoreType(false);
                onChangeNewStoreTypeInput('');
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="취소">
              <Text style={styles.addCategoryBtnTextCancel}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.typeRow}>
        {storeTypes.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.typeChip, storeType === opt.value && styles.typeChipActive]}
            onPress={() => onChangeStoreType(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={`매장 유형 ${opt.label}`}
            accessibilityState={{ selected: storeType === opt.value }}>
            <Text style={[styles.typeChipText, storeType === opt.value && styles.typeChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, styles.registerBtn, isCreating && styles.btnDisabled]}
        onPress={onRegister}
        disabled={isCreating}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isCreating ? '등록 중' : '매장 등록하기'}>
        <Text style={styles.primaryBtnText}>{isCreating ? '등록 중...' : '등록하기'}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
  registerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusMd,
    borderTopRightRadius: spacing.radiusMd,
  },
  registerBack: {
    paddingBottom: spacing.md,
  },
  registerBackText: {
    ...typography.tagText,
    color: colors.primary,
  },
  registerTitle: {
    ...typography.headingLg,
    marginBottom: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  fieldAutoFillBtn: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  fieldInput: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldInputError: {
    borderColor: colors.danger,
  },
  fieldErrorText: {
    ...typography.bodySm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeChip: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    ...typography.tagText,
    color: colors.gray600,
  },
  typeChipTextActive: {
    color: colors.white,
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
  registerBtn: {
    marginTop: spacing.xl,
  },
  btnDisabled: {
    backgroundColor: colors.gray400,
  },
  addCategorySection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  addCategoryBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addCategoryBtn: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryBtnConfirm: {
    backgroundColor: colors.primary,
  },
  addCategoryBtnCancel: {
    backgroundColor: colors.gray200,
  },
  addCategoryBtnText: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.white,
  },
  addCategoryBtnTextCancel: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
});

export default StoreRegisterSheet;
