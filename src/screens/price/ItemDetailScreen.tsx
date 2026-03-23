import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, Image, LayoutAnimation,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import type { UnitType } from '../../types/api.types';
import { usePriceRegisterStore } from '../../store/priceRegisterStore';
import { useSearchProducts } from '../../hooks/queries/useProducts';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import CameraIcon from '../../components/icons/CameraIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';
import ChevronUpIcon from '../../components/icons/ChevronUpIcon';
import { getUnitLabel } from '../../utils/unitLabel';

type Props = PriceRegisterScreenProps<'ItemDetail'>;

const UNIT_OPTIONS: { label: string; value: UnitType }[] = [
  { label: 'kg', value: 'kg' },
  { label: 'g', value: 'g' },
  { label: '개', value: 'count' },
  { label: '봉', value: 'bag' },
  { label: '팩', value: 'pack' },
  { label: '묶음', value: 'bunch' },
  { label: '기타', value: 'other' },
];

const QUALITY_OPTIONS = [
  { label: '상', value: 'HIGH' as const },
  { label: '중', value: 'MID' as const },
  { label: '하', value: 'LOW' as const },
];

/** 인라인 검증 에러 상태 */
interface FormErrors {
  productName?: string;
  price?: string;
  eventDate?: string;
}

/** YYYY-MM-DD 포맷 파서 */
const parseDateString = (s: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ItemDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    imageUri: paramImageUri,
    initialName = '',
    initialPrice = '',
    editIndex,
    initialUnitType,
    initialQuantity,
    initialQuality,
    initialMemo,
    initialHasEvent,
    initialEventStart,
    initialEventEnd,
    initialProductId,
  } = route.params;

  const { storeName, addItem, updateItem, items } = usePriceRegisterStore();

  const [productName, setProductName] = useState(initialName);
  const [price, setPrice] = useState(initialPrice);
  const [quantity, setQuantity] = useState(initialQuantity ?? '');
  const [selectedUnit, setSelectedUnit] = useState<UnitType | undefined>(initialUnitType);
  const [imageUri, setImageUri] = useState<string | undefined>(paramImageUri);
  const [hasEvent, setHasEvent] = useState(initialHasEvent ?? false);
  const [eventStart, setEventStart] = useState(initialEventStart ?? '');
  const [eventEnd, setEventEnd] = useState(initialEventEnd ?? '');
  const [quality, setQuality] = useState<'HIGH' | 'MID' | 'LOW' | undefined>(initialQuality);
  const [memo, setMemo] = useState(initialMemo ?? '');
  const [productId, setProductId] = useState<string | undefined>(initialProductId);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 인라인 에러 상태
  const [errors, setErrors] = useState<FormErrors>({});

  // DatePicker 상태
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [expandOptionalFields, setExpandOptionalFields] = useState(false);

  // blurTimerRef는 ref이므로 dependency에 포함 불필요 — cleanup 전용
  useEffect(() => () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
  }, []);

  const { data: suggestions } = useSearchProducts(productName.trim());

  // 필드 변경 시 해당 에러 클리어
  const handleProductNameChange = useCallback((v: string) => {
    setProductName(v);
    setProductId(undefined);
    setShowSuggestions(true);
    if (v.trim()) setErrors((prev) => ({ ...prev, productName: undefined }));
  }, []);

  const handlePriceChange = useCallback((v: string) => {
    const cleaned = v.replace(/[^0-9]/g, '');
    setPrice(cleaned);
    const num = parseInt(cleaned, 10);
    if (cleaned && !isNaN(num) && num > 0) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  }, []);

  const handleTodayOnly = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setEventStart(today);
    setEventEnd(today);
    setErrors((prev) => ({ ...prev, eventDate: undefined }));
  }, []);

  // DatePicker 핸들러
  const handleStartDateChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      setEventStart(formatDate(date));
      setErrors((prev) => ({ ...prev, eventDate: undefined }));
    }
  }, []);

  const handleEndDateChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      setEventEnd(formatDate(date));
      setErrors((prev) => ({ ...prev, eventDate: undefined }));
    }
  }, []);

  const handlePickImage = useCallback(() => {
    Alert.alert('사진 선택', '사진을 선택하는 방법을 선택해주세요.', [
      { text: '카메라', onPress: () => {
        launchCamera({ mediaType: 'photo', quality: 0.8 }, res => {
          const uri = res.assets?.[0]?.uri;
          if (uri) setImageUri(uri);
        });
      }},
      { text: '갤러리', onPress: () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
          const uri = res.assets?.[0]?.uri;
          if (uri) setImageUri(uri);
        });
      }},
      { text: '취소', style: 'cancel' },
    ]);
  }, []);

  const handleSubmit = useCallback(() => {
    const newErrors: FormErrors = {};
    let hasError = false;

    if (!productName.trim()) {
      newErrors.productName = '상품명을 입력해주세요.';
      hasError = true;
    }

    const priceNum = parseInt(price, 10);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = '올바른 가격을 입력해주세요.';
      hasError = true;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (hasEvent && (!dateRegex.test(eventStart) || !dateRegex.test(eventEnd))) {
      newErrors.eventDate = '이벤트 시작일과 종료일을 선택해주세요.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const item = {
      productId,
      productName: productName.trim(),
      price: priceNum,
      unitType: selectedUnit,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      imageUri,
      condition: hasEvent ? '이벤트중' : undefined,
      quality,
      memo: memo.trim() || undefined,
      eventStart: hasEvent ? eventStart : undefined,
      eventEnd: hasEvent ? eventEnd : undefined,
    };

    if (editIndex !== undefined) {
      updateItem(editIndex, item);
      navigation.navigate('Confirm');
    } else {
      addItem(item);
      Alert.alert(
        '등록 완료',
        `${item.productName}이(가) 추가됐어요.\n같은 매장에서 더 등록할까요?`,
        [
          { text: '더 등록할게요', onPress: () => navigation.navigate('InputMethod') },
          { text: '완료할게요', onPress: () => navigation.navigate('Confirm') },
        ],
      );
    }
  }, [
    productName, price, productId, selectedUnit, quantity,
    imageUri, hasEvent, eventStart, eventEnd, quality, memo,
    editIndex, addItem, updateItem, navigation,
  ]);

  const totalItems = items.length;
  const containerStyle = useMemo(
    () => [styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }],
    [insets.bottom],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={containerStyle}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* 매장명 표시 */}
        <View style={styles.storeRow}>
          <Text style={styles.storeLabel}>매장</Text>
          <Text style={styles.storeNameText} numberOfLines={1}>{storeName ?? ''}</Text>
        </View>

        {/* 상품명 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>상품명 *</Text>
          <TextInput
            style={[styles.input, errors.productName ? styles.inputError : undefined]}
            value={productName}
            onChangeText={handleProductNameChange}
            onBlur={() => setShowSuggestions(false)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="예: 양파, 계란, 삼겹살"
            placeholderTextColor={colors.gray400}
            accessibilityLabel="상품명"
            accessibilityHint="상품 이름을 입력하세요"
          />
          {errors.productName ? (
            <Text style={styles.errorText}>{errors.productName}</Text>
          ) : null}
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.slice(0, 5).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.suggestionItem}
                  accessibilityRole="button"
                  accessibilityLabel={`추천 상품 ${p.name}`}
                  onPress={() => {
                    setProductName(p.name);
                    setProductId(p.id);
                    setSelectedUnit(p.unitType);
                    setShowSuggestions(false);
                  }}
                  onPressIn={() => {
                    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                  }}
                >
                  <Text style={styles.suggestionText}>{p.name}</Text>
                  <Text style={styles.suggestionUnit}>{getUnitLabel(p.unitType)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 가격 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>가격 *</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput, errors.price ? styles.inputError : undefined]}
              value={price}
              onChangeText={handlePriceChange}
              placeholder="0"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              accessibilityLabel="가격"
              accessibilityHint="가격을 숫자로 입력하세요"
            />
            <Text style={styles.priceSuffix}>원</Text>
          </View>
          {errors.price ? (
            <Text style={styles.errorText}>{errors.price}</Text>
          ) : null}
        </View>


        {/* 이벤트/할인 */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>이벤트/할인 여부</Text>
            <Switch
              value={hasEvent}
              onValueChange={setHasEvent}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityRole="switch"
              accessibilityLabel="이벤트/할인 여부"
              accessibilityState={{ checked: hasEvent }}
            />
          </View>
          {hasEvent && (
            <View style={styles.dateSection}>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.datePickerBtn, errors.eventDate ? styles.inputError : undefined]}
                  onPress={() => setShowStartPicker(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={eventStart ? `시작일 ${eventStart}` : '시작일 선택'}
                >
                  <Text style={[styles.datePickerText, !eventStart && styles.datePickerPlaceholder]}>
                    {eventStart || '시작일 선택'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.dateSep}>~</Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, errors.eventDate ? styles.inputError : undefined]}
                  onPress={() => setShowEndPicker(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={eventEnd ? `종료일 ${eventEnd}` : '종료일 선택'}
                >
                  <Text style={[styles.datePickerText, !eventEnd && styles.datePickerPlaceholder]}>
                    {eventEnd || '종료일 선택'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.eventDate ? (
                <Text style={styles.errorText}>{errors.eventDate}</Text>
              ) : null}
              <TouchableOpacity style={styles.todayBtn} onPress={handleTodayOnly} accessibilityRole="button" accessibilityLabel="오늘만 설정">
                <Text style={styles.todayBtnText}>오늘만</Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={parseDateString(eventStart) ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                  locale="ko"
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={parseDateString(eventEnd) ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                  minimumDate={parseDateString(eventStart) ?? undefined}
                  locale="ko"
                />
              )}
            </View>
          )}
        </View>

        {/* 사진 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>사진</Text>
          {imageUri ? (
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="사진 변경">
              <Image source={{ uri: imageUri }} style={styles.photoThumb} resizeMode="cover" accessibilityRole="image" accessibilityLabel="촬영한 가격표 사진" />
              <Text style={styles.changePhotoText}>사진 변경</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePickImage} accessibilityRole="button" accessibilityLabel="사진 추가">
              <CameraIcon size={28} color={colors.gray400} />
              <Text style={styles.photoPlaceholderText}>사진 추가</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 추가 정보 (선택) - 접이식 */}
        <View style={styles.field}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.create(
                  200,
                  LayoutAnimation.Types.easeInEaseOut,
                  LayoutAnimation.Properties.opacity
                )
              );
              setExpandOptionalFields(!expandOptionalFields);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="추가 정보"
            accessibilityState={{ expanded: expandOptionalFields }}
          >
            <Text style={styles.collapsibleTitle}>추가 정보 (선택)</Text>
            {expandOptionalFields ? (
              <ChevronUpIcon size={20} color={colors.gray600} />
            ) : (
              <ChevronDownIcon size={20} color={colors.gray600} />
            )}
          </TouchableOpacity>

          {expandOptionalFields && (
            <View>
              {/* 단위 */}
              <View style={styles.optionalFieldGroup}>
                <Text style={styles.fieldLabel}>단위</Text>
                <View style={styles.chipRow}>
                  {UNIT_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, selectedUnit === opt.value && styles.chipActive]}
                      onPress={() => setSelectedUnit(selectedUnit === opt.value ? undefined : opt.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`단위 ${opt.label}`}
                      accessibilityState={{ selected: selectedUnit === opt.value }}
                    >
                      <Text style={[styles.chipText, selectedUnit === opt.value && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedUnit && (
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="수량 (예: 1, 30, 600)"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                    accessibilityLabel="수량"
                    accessibilityHint="수량을 숫자로 입력하세요"
                  />
                )}
              </View>

              {/* 품질 */}
              <View style={styles.optionalFieldGroup}>
                <Text style={styles.fieldLabel}>품질</Text>
                <View style={styles.chipRow}>
                  {QUALITY_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, quality === opt.value && styles.chipActive]}
                      onPress={() => setQuality(quality === opt.value ? undefined : opt.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`품질 ${opt.label}`}
                      accessibilityState={{ selected: quality === opt.value }}
                    >
                      <Text style={[styles.chipText, quality === opt.value && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 메모 */}
              <View style={styles.optionalFieldGroup}>
                <Text style={styles.fieldLabel}>메모</Text>
                <TextInput
                  style={[styles.input, styles.memoInput]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="참고할 내용이 있다면 (최대 200자)"
                  placeholderTextColor={colors.gray400}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                  accessibilityLabel="메모"
                  accessibilityHint="참고할 내용을 입력하세요"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 등록 버튼 */}
      <View style={styles.footer}>
        {totalItems > 0 && editIndex === undefined && (
          <Text style={styles.footerCount}>현재 {totalItems}개 담긴 상태</Text>
        )}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={editIndex !== undefined ? '수정 완료' : '등록'}>
          <Text style={styles.submitBtnText}>
            {editIndex !== undefined ? '수정 완료' : '등록'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  storeRow: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
    gap: spacing.sm,
  },
  storeLabel: { ...typography.bodySm, fontWeight: '500' as const, color: colors.gray400 },
  storeNameText: { ...typography.headingMd, flex: 1 },
  field: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  fieldLabel: { ...typography.tagText, fontWeight: '600' as const, color: colors.gray600, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: { flex: 1 },
  priceSuffix: { ...typography.headingMd, color: colors.gray600 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.gray100, borderRadius: spacing.radiusFull, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.tagText, color: colors.gray600 },
  chipTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  collapsibleTitle: {
    ...typography.tagText,
    fontWeight: '600' as const,
    color: colors.gray600,
  },
  optionalFieldGroup: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray100,
  },
  dateSection: { marginTop: spacing.md, gap: spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  datePickerBtn: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  datePickerText: {
    ...typography.body,
  },
  datePickerPlaceholder: {
    color: colors.gray400,
  },
  dateSep: { ...typography.body, color: colors.gray400 },
  todayBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.xs + spacing.micro,
    paddingHorizontal: spacing.inputPad,
  },
  todayBtnText: { ...typography.tagText, fontWeight: '600' as const, color: colors.primary },
  photoThumb: { width: '100%', height: spacing.imagePreviewH, borderRadius: spacing.radiusMd },
  changePhotoText: { ...typography.bodySm, color: colors.primary, marginTop: spacing.xs + spacing.micro, textAlign: 'center' },
  photoPlaceholder: {
    height: spacing.cameraControlSize + spacing.md + spacing.md + spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoPlaceholderText: { ...typography.bodySm, color: colors.gray400 },
  quantityInput: { marginTop: spacing.sm },
  memoInput: { minHeight: spacing.cameraControlSize + spacing.md + spacing.md, paddingTop: spacing.md },
  suggestions: {
    backgroundColor: colors.white,
    borderRadius: spacing.radiusMd,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.inputPad,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  suggestionText: { ...typography.body },
  suggestionUnit: { ...typography.bodySm, color: colors.gray400 },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray200,
  },
  footerCount: { ...typography.bodySm, color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  submitBtnText: { ...typography.headingLg, color: colors.white },
});

export default ItemDetailScreen;
