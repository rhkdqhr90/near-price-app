import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import type { MyPageScreenProps } from '../../navigation/types';
import { flyerApi } from '../../api/flyer.api';
import { ownerApi } from '../../api/owner.api';
import { uploadApi } from '../../api/upload.api';
import { isAxiosError } from '../../api/client';
import { STALE_TIME } from '../../lib/queryClient';
import type { FlyerProductItem, FlyerResponse, FlyerTemplateType } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import FlyerPreviewModal from '../../components/flyer/FlyerPreviewModal';

// ─── 로컬 헬퍼 ───────────────────────────────────────────────────────────────

const inferMimeTypeFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  return map[ext] ?? 'image/jpeg';
};

const inferExtFromMimeType = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'jpg';
};

const normalizeMimeType = (mimeType: string | undefined): string | null => {
  if (!mimeType) {
    return null;
  }
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
};

const ensureFileNameWithExt = (fileName: string, mimeType: string): string => {
  const trimmed = fileName.trim();
  if (/\.[a-z0-9]+$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.${inferExtFromMimeType(mimeType)}`;
};

const inferFileNameFromUri = (uri: string): string => {
  const parts = uri.split('/');
  return parts[parts.length - 1] ?? `image_${Date.now()}`;
};

interface UploadImageMeta {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

const toUploadImageMeta = (asset: Asset): UploadImageMeta | null => {
  if (!asset.uri) {
    return null;
  }

  const normalizedMimeType = normalizeMimeType(asset.type);
  const fallbackName = inferFileNameFromUri(asset.uri);
  const baseFileName = asset.fileName?.trim() || fallbackName;
  const mimeType = normalizedMimeType ?? inferMimeTypeFromPath(baseFileName);
  const fileName = ensureFileNameWithExt(baseFileName, mimeType);

  return {
    uri: asset.uri,
    fileName,
    mimeType,
    fileSize: asset.fileSize,
  };
};

const makeTempId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const TEMPLATES: Array<{ key: FlyerTemplateType; label: string; emoji: string; desc: string }> = [
  { key: 'classic', label: 'A4 컬러', emoji: '🎯', desc: '강한 가격 강조의 A4 컬러 전단' },
  { key: 'news', label: '신문 삽지', emoji: '🗞️', desc: '동네 신문 삽지 느낌의 전단' },
  { key: 'retro', label: '리소', emoji: '🛒', desc: '리소 인쇄톤의 빈티지 전단' },
  { key: 'coupon', label: '포스터', emoji: '✂️', desc: '벽보형 포스터 스타일 전단' },
];

const BADGE_TYPES: Array<{ type: 'red' | 'yellow' | 'blue'; label: string; color: string }> = [
  { type: 'red', label: '빨강', color: colors.flyerRed },
  { type: 'yellow', label: '노랑', color: colors.flyerBadgeYellow },
  { type: 'blue', label: '파랑', color: colors.flyerBadgeBlue },
];

const MAX_PRODUCTS = 50;

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface DraftProduct {
  tempId: string;
  name: string;
  emoji: string;
  imageUrl: string | null;
  imageUploading: boolean;
  originalPrice: string;
  salePrice: string;
  badgeLabel: string;
  badgeType: 'red' | 'yellow' | 'blue';
}

const emptyDraft = (): DraftProduct => ({
  tempId: makeTempId(),
  name: '',
  emoji: '🛍️',
  imageUrl: null,
  imageUploading: false,
  originalPrice: '',
  salePrice: '',
  badgeLabel: '',
  badgeType: 'red',
});

type Props = MyPageScreenProps<'OwnerFlyerForm'>;

// ─── Main Screen ──────────────────────────────────────────────────────────────

const OwnerFlyerFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { mode } = route.params;
  const isEditMode = mode === 'edit';
  const editingFlyerId = isEditMode ? route.params.flyerId : null;

  const { data: myApplication, isLoading: isApplicationLoading } = useQuery({
    queryKey: ['owner', 'me'],
    queryFn: () => ownerApi.getMyApplication().then((res) => res.data),
    staleTime: STALE_TIME.short,
  });

  const { data: myFlyers, isLoading: isFlyersLoading } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyerApi.getMyFlyers().then((res) => res.data),
    enabled: isEditMode,
    staleTime: STALE_TIME.short,
  });

  const editingFlyer = useMemo(
    () =>
      editingFlyerId
        ? myFlyers?.find((item) => item.id === editingFlyerId)
        : undefined,
    [editingFlyerId, myFlyers],
  );

  // ── 기본 폼 상태 ──────────────────────────────────────────────────────────
  const [templateType, setTemplateType] = useState<FlyerTemplateType>('classic');
  const [promotionTitle, setPromotionTitle] = useState('');
  const [badge, setBadge] = useState('특가');
  const [badgeColor, setBadgeColor] = useState('#2E7D32');
  const [dateRange, setDateRange] = useState('기간한정');
  const [highlight, setHighlight] = useState('사장님이 준비한 알뜰 행사');
  const [warningText, setWarningText] = useState('');
  const [ownerQuote, setOwnerQuote] = useState('');

  // ── 상품 목록 상태 ────────────────────────────────────────────────────────
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [draft, setDraft] = useState<DraftProduct>(emptyDraft);
  const loadedEditFlyerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEditMode) {
      loadedEditFlyerIdRef.current = null;
      setTemplateType('classic');
      setPromotionTitle('');
      setBadge('특가');
      setBadgeColor('#2E7D32');
      setDateRange('기간한정');
      setHighlight('사장님이 준비한 알뜰 행사');
      setWarningText('');
      setOwnerQuote('');
      setEditingTempId(null);
      setProducts([]);
      setDraft(emptyDraft());
      return;
    }

    if (!editingFlyer) {
      return;
    }

    if (loadedEditFlyerIdRef.current === editingFlyer.id) {
      return;
    }

    loadedEditFlyerIdRef.current = editingFlyer.id;

    setTemplateType(editingFlyer.templateType ?? 'classic');
    setPromotionTitle(editingFlyer.promotionTitle);
    setBadge(editingFlyer.badge);
    setBadgeColor(editingFlyer.badgeColor);
    setDateRange(editingFlyer.dateRange);
    setHighlight(editingFlyer.highlight);
    setWarningText(editingFlyer.warningText ?? '');
    setOwnerQuote(editingFlyer.ownerQuote ?? '');
    setEditingTempId(null);
    setProducts(
      (editingFlyer.products ?? []).map((p) => ({
        tempId: p.id,
        name: p.name,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        imageUploading: false,
        originalPrice: p.originalPrice !== null ? String(p.originalPrice) : '',
        salePrice: String(p.salePrice),
        badgeLabel: p.badges[0]?.label ?? '',
        badgeType: p.badges[0]?.type ?? 'red',
      })),
    );
    setDraft(emptyDraft);
  }, [editingFlyer, isEditMode]);

  // ── 이미지 업로드 뮤테이션 ────────────────────────────────────────────────
  const { mutateAsync: uploadImage } = useMutation({
    mutationFn: async (meta: UploadImageMeta) => {
      const response = await uploadApi.uploadImage(
        meta.uri,
        meta.fileName,
        meta.mimeType,
        meta.fileSize,
      );
      return response.data.url;
    },
  });

  // ── 상품 이미지 선택 ──────────────────────────────────────────────────────
  const handlePickDraftImage = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 0.8 },
      async (result) => {
        if (result.didCancel) { return; }
        const asset = result.assets?.[0];
        if (!asset?.uri) {
          Alert.alert('오류', '이미지를 선택하지 못했습니다.');
          return;
        }

        const uploadMeta = toUploadImageMeta(asset);
        if (!uploadMeta) {
          Alert.alert('오류', '이미지 메타데이터를 읽지 못했습니다.');
          return;
        }

        setDraft((prev) => ({ ...prev, imageUploading: true }));
        try {
          const url = await uploadImage(uploadMeta);
          setDraft((prev) => ({ ...prev, imageUrl: url, imageUploading: false }));
        } catch (error: unknown) {
          const message =
            isAxiosError(error) &&
            typeof error.response?.data?.message === 'string'
              ? error.response.data.message
              : '이미지 업로드에 실패했습니다.';
          Alert.alert('오류', message);
          setDraft((prev) => ({ ...prev, imageUploading: false }));
        }
      },
    );
  }, [uploadImage]);

  // ── 상품 추가 ─────────────────────────────────────────────────────────────
  const handleAddProduct = useCallback(() => {
    if (draft.imageUploading) {
      Alert.alert('잠시 기다려주세요', '이미지 업로드 중입니다.');
      return;
    }
    if (!draft.name.trim()) {
      Alert.alert('입력 오류', '상품명을 입력해주세요.');
      return;
    }
    const salePriceNum = parseFloat(draft.salePrice.replace(/,/g, ''));
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      Alert.alert('입력 오류', '올바른 판매가를 입력해주세요.');
      return;
    }
    if (products.length >= MAX_PRODUCTS) {
      Alert.alert('제한 초과', `상품은 최대 ${MAX_PRODUCTS}개까지 등록할 수 있습니다.`);
      return;
    }
    setProducts((prev) => [...prev, { ...draft }]);
    setDraft(emptyDraft());
  }, [draft, products.length]);

  // ── 상품 삭제 ─────────────────────────────────────────────────────────────
  const handleRemoveProduct = useCallback((tempId: string) => {
    setProducts((prev) => prev.filter((p) => p.tempId !== tempId));
    setEditingTempId((prev) => (prev === tempId ? null : prev));
  }, []);

  // ── 상품 순서 변경 ────────────────────────────────────────────────────────
  const handleMoveProduct = useCallback((tempId: string, direction: 'up' | 'down') => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.tempId === tempId);
      if (idx < 0) { return prev; }
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) { return prev; }
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  // ── 상품 편집 시작 ────────────────────────────────────────────────────────
  const [editingTempId, setEditingTempId] = useState<string | null>(null);

  const handleEditProduct = useCallback((p: DraftProduct) => {
    setEditingTempId(p.tempId);
    setDraft({ ...p });
  }, []);

  // ── 상품 편집 완료 ────────────────────────────────────────────────────────
  const handleUpdateProduct = useCallback(() => {
    if (draft.imageUploading) {
      Alert.alert('잠시 기다려주세요', '이미지 업로드 중입니다.');
      return;
    }
    if (!draft.name.trim()) {
      Alert.alert('입력 오류', '상품명을 입력해주세요.');
      return;
    }
    const salePriceNum = parseFloat(draft.salePrice.replace(/,/g, ''));
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      Alert.alert('입력 오류', '올바른 판매가를 입력해주세요.');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.tempId === editingTempId ? { ...draft } : p)),
    );
    setEditingTempId(null);
    setDraft(emptyDraft());
  }, [draft, editingTempId]);

  const handleCancelEdit = useCallback(() => {
    setEditingTempId(null);
    setDraft(emptyDraft());
  }, []);

  // ── 전체 폼 제출 — mutationFn은 네트워크 호출만 담당 ─────────────────────
  const { mutateAsync: submitFlyer, isPending: isSubmitting } = useMutation({
    mutationFn: async (payload: Parameters<typeof flyerApi.createMyFlyer>[0]) => {
      if (isEditMode) {
        return await flyerApi.updateMyFlyer(route.params.flyerId, payload);
      }
      return await flyerApi.createMyFlyer(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['flyers'] });
      Alert.alert('완료', isEditMode ? '전단지가 수정되었습니다.' : '전단지가 생성되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    },
  });

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── 제출 전 유효성 검사 + 페이로드 빌드 ──────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!promotionTitle.trim()) { Alert.alert('입력 오류', '전단지 제목을 입력해주세요.'); return; }
    if (!badge.trim()) { Alert.alert('입력 오류', '배지 문구를 입력해주세요.'); return; }
    if (!badgeColor.trim()) { Alert.alert('입력 오류', '배지 색상을 입력해주세요.'); return; }
    if (!dateRange.trim()) { Alert.alert('입력 오류', '행사 기간 문구를 입력해주세요.'); return; }
    if (!highlight.trim()) { Alert.alert('입력 오류', '한 줄 소개를 입력해주세요.'); return; }
    if (!myApplication?.store.name) { Alert.alert('오류', '매장 정보를 찾을 수 없습니다.'); return; }

    const flyerProducts: FlyerProductItem[] = products.map((p) => ({
      id: p.tempId,
      name: p.name.trim(),
      emoji: p.emoji,
      imageUrl: p.imageUrl,
      salePrice: parseFloat(p.salePrice.replace(/,/g, '')) || 0,
      originalPrice: p.originalPrice ? (parseFloat(p.originalPrice.replace(/,/g, '')) || null) : null,
      badges: p.badgeLabel.trim() ? [{ label: p.badgeLabel.trim(), type: p.badgeType }] : [],
    }));

    const payload = {
      storeName: myApplication.store.name,
      storeAddress: myApplication.store.address,
      templateType,
      promotionTitle: promotionTitle.trim(),
      badge: badge.trim(),
      badgeColor: badgeColor.trim(),
      dateRange: dateRange.trim(),
      highlight: highlight.trim(),
      warningText: warningText.trim() || undefined,
      ownerQuote: ownerQuote.trim() || undefined,
      products: flyerProducts.length > 0 ? flyerProducts : undefined,
    };

    try {
      await submitFlyer(payload);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message = Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message.join('\n')
          : typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : '요청 처리에 실패했습니다.';
        Alert.alert('오류', message);
        return;
      }
      Alert.alert('오류', '요청 처리에 실패했습니다.');
    }
  }, [
    promotionTitle, badge, badgeColor, dateRange, highlight,
    myApplication, products, templateType, warningText, ownerQuote,
    submitFlyer,
  ]);

  // ── 미리보기 ──────────────────────────────────────────────────────────────
  const [previewVisible, setPreviewVisible] = useState(false);
  const handleOpenPreview = useCallback(() => setPreviewVisible(true), []);
  const handleClosePreview = useCallback(() => setPreviewVisible(false), []);

  // previewVisible이 false일 때는 연산 스킵
  const previewFlyer = useMemo<FlyerResponse | null>(() => {
    if (!previewVisible) { return null; }
    const storeName = myApplication?.store.name ?? '내 매장';
    const storeAddress = myApplication?.store.address ?? null;
    const flyerProducts: FlyerProductItem[] = products.map((p) => ({
      id: p.tempId,
      name: p.name.trim() || '상품명',
      emoji: p.emoji,
      imageUrl: p.imageUrl,
      salePrice: parseFloat(p.salePrice.replace(/,/g, '')) || 0,
      originalPrice: p.originalPrice ? (parseFloat(p.originalPrice.replace(/,/g, '')) || null) : null,
      badges: p.badgeLabel.trim() ? [{ label: p.badgeLabel.trim(), type: p.badgeType }] : [],
    }));
    return {
      id: 'preview',
      storeName,
      promotionTitle: promotionTitle.trim() || '전단지 제목',
      badge: badge.trim() || '특가',
      badgeColor: badgeColor.trim() || '#2E7D32',
      dateRange: dateRange.trim() || '기간한정',
      highlight: highlight.trim() || '이번 주 특별 행사',
      bgColor: '#F5F5F5',
      emoji: '🏪',
      warningText: warningText.trim() || null,
      ownerQuote: ownerQuote.trim() || null,
      ownerName: storeName,
      ownerRole: '사장님',
      storeAddress,
      storeId: myApplication?.store.id ?? null,
      storeRating: null,
      storeReviewCount: null,
      products: flyerProducts.length > 0 ? flyerProducts : null,
      reviews: null,
      templateType,
      isActive: true,
      ownerApplicationId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    previewVisible,
    myApplication,
    products,
    promotionTitle,
    badge,
    badgeColor,
    dateRange,
    highlight,
    warningText,
    ownerQuote,
    templateType,
  ]);

  if (isApplicationLoading || (isEditMode && isFlyersLoading)) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isEditMode && !editingFlyer) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.missingText}>수정할 전단지를 찾을 수 없습니다.</Text>
        <TouchableOpacity
          style={styles.missingButton}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Text style={styles.missingButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ChevronLeftIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? '전단지 수정' : '전단지 생성'}
        </Text>
        <TouchableOpacity
          style={styles.previewBtn}
          onPress={handleOpenPreview}
          accessibilityRole="button"
          accessibilityLabel="전단지 미리보기"
        >
          <Text style={styles.previewBtnText}>미리보기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <InfoField label="매장" value={myApplication?.store.name ?? '-'} />

        {/* 템플릿 선택 */}
        <Text style={styles.label}>전단지 디자인 *</Text>
        <Text style={styles.templateHint}>원하는 스타일을 선택하면 자동으로 디자인됩니다</Text>
        <View style={styles.templateGrid}>
          {TEMPLATES.map((t) => {
            const active = templateType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.templateCard, active && styles.templateCardActive]}
                onPress={() => setTemplateType(t.key)}
                accessibilityRole="button"
                accessibilityLabel={`${t.label} 템플릿 선택`}
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.templateEmoji}>{t.emoji}</Text>
                <Text style={[styles.templateLabel, active && styles.templateLabelActive]}>
                  {t.label}
                </Text>
                <Text style={styles.templateDesc} numberOfLines={2}>{t.desc}</Text>
                {active && (
                  <View style={styles.templateCheck}>
                    <Text style={styles.templateCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 기본 정보 ── */}
        <Text style={styles.label}>전단지 제목 *</Text>
        <TextInput
          style={styles.input}
          value={promotionTitle}
          onChangeText={setPromotionTitle}
          placeholder="예: 주말 특가 행사"
          placeholderTextColor={colors.gray400}
          maxLength={100}
        />

        <Text style={styles.label}>배지 문구 *</Text>
        <TextInput
          style={styles.input}
          value={badge}
          onChangeText={setBadge}
          placeholder="예: 특가"
          placeholderTextColor={colors.gray400}
          maxLength={30}
        />

        <Text style={styles.label}>배지 색상 *</Text>
        <TextInput
          style={styles.input}
          value={badgeColor}
          onChangeText={setBadgeColor}
          placeholder="예: #2E7D32"
          placeholderTextColor={colors.gray400}
          maxLength={30}
        />

        <Text style={styles.label}>행사 기간 문구 *</Text>
        <TextInput
          style={styles.input}
          value={dateRange}
          onChangeText={setDateRange}
          placeholder="예: 4/25 - 4/30"
          placeholderTextColor={colors.gray400}
          maxLength={100}
        />

        <Text style={styles.label}>한 줄 소개 *</Text>
        <TextInput
          style={styles.input}
          value={highlight}
          onChangeText={setHighlight}
          placeholder="예: 신선한 제철 상품을 합리적인 가격으로"
          placeholderTextColor={colors.gray400}
          maxLength={200}
        />

        <Text style={styles.label}>안내 문구</Text>
        <TextInput
          style={styles.input}
          value={warningText}
          onChangeText={setWarningText}
          placeholder="예: 행사 상품은 조기 품절될 수 있습니다"
          placeholderTextColor={colors.gray400}
          maxLength={200}
        />

        <Text style={styles.label}>사장님 한마디</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={ownerQuote}
          onChangeText={setOwnerQuote}
          placeholder="고객에게 전할 메세지를 입력해주세요"
          placeholderTextColor={colors.gray400}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />

        {/* ── 상품 등록 ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>상품 등록</Text>
          <Text style={styles.sectionCount}>{products.length}/{MAX_PRODUCTS}</Text>
        </View>
        <Text style={styles.sectionHint}>전단지에 넣을 상품을 추가하세요. 클릭하면 상세가 표시됩니다.</Text>

        {/* 등록된 상품 목록 */}
        {products.length > 0 && (
          <View style={styles.productList}>
            {products.map((p, idx) => {
              const isEditing = editingTempId === p.tempId;
              return (
                <View
                  key={p.tempId}
                  style={[styles.productRow, isEditing && styles.productRowEditing]}
                >
                  {/* 순서 이동 버튼 */}
                  <View style={styles.productOrderBtns}>
                    <TouchableOpacity
                      onPress={() => handleMoveProduct(p.tempId, 'up')}
                      disabled={idx === 0}
                      accessibilityRole="button"
                      accessibilityLabel="위로 이동"
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text style={[styles.productOrderText, idx === 0 && styles.productOrderTextDisabled]}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.productRowIdx}>{idx + 1}</Text>
                    <TouchableOpacity
                      onPress={() => handleMoveProduct(p.tempId, 'down')}
                      disabled={idx === products.length - 1}
                      accessibilityRole="button"
                      accessibilityLabel="아래로 이동"
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text style={[styles.productOrderText, idx === products.length - 1 && styles.productOrderTextDisabled]}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 썸네일 */}
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.productThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.productThumbEmoji}>
                      <Text style={styles.productThumbEmojiText}>{p.emoji}</Text>
                    </View>
                  )}

                  {/* 정보 */}
                  <View style={styles.productRowInfo}>
                    <Text style={styles.productRowName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productRowPrice}>
                      {Number(p.salePrice.replace(/,/g, '')).toLocaleString('ko-KR')}원
                      {p.originalPrice ? ` (정가 ${Number(p.originalPrice.replace(/,/g, '')).toLocaleString('ko-KR')}원)` : ''}
                    </Text>
                  </View>

                  {/* 편집 / 삭제 */}
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.productEditBtn}
                      onPress={() => (isEditing ? handleCancelEdit() : handleEditProduct(p))}
                      accessibilityRole="button"
                      accessibilityLabel={isEditing ? '편집 취소' : `${p.name} 편집`}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.productEditText}>{isEditing ? '취소' : '편집'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.productDeleteBtn}
                      onPress={() => handleRemoveProduct(p.tempId)}
                      accessibilityRole="button"
                      accessibilityLabel={`${p.name} 삭제`}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <Text style={styles.productDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 상품 추가/편집 폼 */}
        {(products.length < MAX_PRODUCTS || editingTempId !== null) && (
          <View style={[styles.addProductForm, editingTempId !== null && styles.addProductFormEditing]}>
            <Text style={styles.addProductFormTitle}>
              {editingTempId !== null ? '✏️ 상품 수정' : '+ 상품 추가'}
            </Text>

            {/* 이미지 */}
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={handlePickDraftImage}
              disabled={draft.imageUploading}
              accessibilityRole="button"
              accessibilityLabel="상품 이미지 선택"
            >
              {draft.imageUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : draft.imageUrl ? (
                <Image source={{ uri: draft.imageUrl }} style={styles.imagePickerPreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={styles.imagePickerPlaceholderEmoji}>{draft.emoji}</Text>
                  <Text style={styles.imagePickerPlaceholderText}>이미지 선택</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 이모지 (이미지 없을 때 표시) */}
            <Text style={styles.label}>이모지</Text>
            <TextInput
              style={styles.input}
              value={draft.emoji}
              onChangeText={(v) => setDraft((prev) => ({ ...prev, emoji: v }))}
              placeholder="예: 🍎"
              placeholderTextColor={colors.gray400}
              maxLength={4}
            />

            {/* 상품명 */}
            <Text style={styles.label}>상품명 *</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(v) => setDraft((prev) => ({ ...prev, name: v }))}
              placeholder="예: 국산 사과 1.5kg"
              placeholderTextColor={colors.gray400}
              maxLength={100}
            />

            {/* 판매가 */}
            <Text style={styles.label}>판매가 (원) *</Text>
            <TextInput
              style={styles.input}
              value={draft.salePrice}
              onChangeText={(v) => setDraft((prev) => ({ ...prev, salePrice: v }))}
              placeholder="예: 9900"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              maxLength={12}
            />

            {/* 정가 */}
            <Text style={styles.label}>정가 (원, 선택)</Text>
            <TextInput
              style={styles.input}
              value={draft.originalPrice}
              onChangeText={(v) => setDraft((prev) => ({ ...prev, originalPrice: v }))}
              placeholder="예: 15000"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              maxLength={12}
            />

            {/* 배지 */}
            <Text style={styles.label}>배지 문구 (선택)</Text>
            <TextInput
              style={styles.input}
              value={draft.badgeLabel}
              onChangeText={(v) => setDraft((prev) => ({ ...prev, badgeLabel: v }))}
              placeholder="예: 신상품"
              placeholderTextColor={colors.gray400}
              maxLength={20}
            />

            {/* 배지 색상 */}
            <Text style={styles.label}>배지 색상</Text>
            <View style={styles.badgeTypeRow}>
              {BADGE_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt.type}
                  style={[
                    styles.badgeTypeBtn,
                    { borderColor: bt.color },
                    draft.badgeType === bt.type && { backgroundColor: bt.color },
                  ]}
                  onPress={() => setDraft((prev) => ({ ...prev, badgeType: bt.type }))}
                  accessibilityRole="button"
                  accessibilityLabel={`배지 색상 ${bt.label}`}
                  accessibilityState={{ selected: draft.badgeType === bt.type }}
                >
                  <Text
                    style={[
                      styles.badgeTypeBtnText,
                      { color: draft.badgeType === bt.type ? colors.white : bt.color },
                    ]}
                  >
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={editingTempId !== null ? handleUpdateProduct : handleAddProduct}
              accessibilityRole="button"
              accessibilityLabel={editingTempId !== null ? '상품 수정 완료' : '상품 목록에 추가'}
            >
              <Text style={styles.addProductBtnText}>
                {editingTempId !== null ? '수정 완료' : '목록에 추가'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 제출 버튼 */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? '전단지 수정 저장' : '전단지 생성'}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? '수정 저장' : '전단지 생성'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <FlyerPreviewModal
        flyer={previewFlyer}
        onClose={handleClosePreview}
      />
    </KeyboardAvoidingView>
  );
};

// ─── InfoField ────────────────────────────────────────────────────────────────

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoFieldBox}>
    <Text style={styles.infoFieldLabel}>{label}</Text>
    <Text style={styles.infoFieldValue}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.headingMd,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: spacing.headerIconSize,
  },
  previewBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  previewBtnText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  infoFieldBox: {
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoFieldLabel: {
    ...typography.caption,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  infoFieldValue: {
    ...typography.body,
    fontWeight: '700' as const,
    color: colors.black,
  },
  label: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.black,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },
  multilineInput: {
    minHeight: 120,
  },
  templateHint: {
    ...typography.caption,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  templateCard: {
    width: '47.5%',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    backgroundColor: colors.white,
    position: 'relative',
    minHeight: 100,
  },
  templateCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  templateEmoji: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  templateLabel: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.black,
    marginBottom: 2,
  },
  templateLabelActive: {
    color: colors.primary,
  },
  templateDesc: {
    ...typography.caption,
    color: colors.gray600,
    lineHeight: 16,
  },
  templateCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCheckText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: colors.white,
  },

  // ── 상품 섹션 ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    ...typography.headingMd,
    color: colors.black,
  },
  sectionCount: {
    ...typography.bodySm,
    color: colors.gray600,
    fontWeight: '700' as const,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.gray600,
    marginBottom: spacing.md,
  },

  // 등록된 상품 목록
  productList: {
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  productRowEditing: {
    backgroundColor: colors.primaryLight,
  },
  productOrderBtns: {
    alignItems: 'center',
    gap: 2,
  },
  productOrderText: {
    fontSize: 9,
    color: colors.gray400,
    fontWeight: '700' as const,
  },
  productOrderTextDisabled: {
    opacity: 0.2,
  },
  productRowIdx: {
    ...typography.caption,
    color: colors.gray400,
    width: 14,
    textAlign: 'center',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  productEditBtn: {
    padding: spacing.xs,
  },
  productEditText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.gray100,
  },
  productThumbEmoji: {
    width: 40,
    height: 40,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumbEmojiText: {
    fontSize: 22,
  },
  productRowInfo: {
    flex: 1,
  },
  productRowName: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.black,
    marginBottom: 2,
  },
  productRowPrice: {
    ...typography.caption,
    color: colors.gray600,
  },
  productDeleteBtn: {
    padding: spacing.xs,
  },
  productDeleteText: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: '700' as const,
  },

  // 상품 추가 폼
  addProductForm: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    backgroundColor: colors.gray100,
    marginBottom: spacing.md,
  },
  addProductFormEditing: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  addProductFormTitle: {
    ...typography.bodySm,
    fontWeight: '800' as const,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  imagePickerBtn: {
    width: '100%',
    height: 120,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    marginBottom: spacing.xs,
  },
  imagePickerPreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  imagePickerPlaceholderEmoji: {
    fontSize: 32,
  },
  imagePickerPlaceholderText: {
    ...typography.caption,
    color: colors.gray600,
  },
  badgeTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeTypeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusSm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  badgeTypeBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  addProductBtn: {
    marginTop: spacing.lg,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addProductBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },

  // 제출 버튼
  submitButton: {
    marginTop: spacing.xl,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },
  missingText: {
    ...typography.body,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  missingButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  missingButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },
});

export default OwnerFlyerFormScreen;
