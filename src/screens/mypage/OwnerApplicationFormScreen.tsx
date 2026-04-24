import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { ownerApi } from '../../api/owner.api';
import { storeApi } from '../../api/store.api';
import { uploadApi } from '../../api/upload.api';
import { isAxiosError } from '../../api/client';
import { STALE_TIME } from '../../lib/queryClient';
import type { StoreResponse } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';

type Props = MyPageScreenProps<'OwnerApplicationForm'>;

const inferMimeTypeFromPath = (path: string): string => {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

const inferFileNameFromUri = (uri: string): string => {
  const sanitized = uri.split('?')[0];
  const parts = sanitized.split('/');
  const candidate = parts[parts.length - 1];
  if (candidate && candidate.length > 0) {
    return candidate;
  }
  return `owner-proof-${Date.now()}.jpg`;
};

const OwnerApplicationFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mode = route.params.mode;
  const isEditMode = mode === 'edit';

  const {
    data: existingApplication,
    isLoading: isApplicationLoading,
    isError: isApplicationError,
    error: applicationError,
  } = useQuery({
    queryKey: ['owner', 'me'],
    queryFn: () => ownerApi.getMyApplication().then((res) => res.data),
    enabled: isEditMode,
    staleTime: STALE_TIME.short,
    retry: false,
  });

  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] =
    useState('');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [storeResults, setStoreResults] = useState<StoreResponse[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreResponse | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [proofImageLocalUri, setProofImageLocalUri] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!existingApplication) {
      return;
    }

    setOwnerName(existingApplication.ownerName);
    setOwnerPhone(existingApplication.ownerPhone);
    setSelectedStore({
      id: existingApplication.store.id,
      name: existingApplication.store.name,
      type: 'mart',
      latitude: 0,
      longitude: 0,
      address: existingApplication.store.address,
      externalPlaceId: null,
      createdAt: existingApplication.createdAt,
      updatedAt: existingApplication.updatedAt,
    });
    setProofImageUrl(existingApplication.proofImageUrl);
    setProofImageLocalUri(existingApplication.proofImageUrl);
  }, [existingApplication]);

  const { mutateAsync: searchStores, isPending: isSearchingStores } = useMutation({
    mutationFn: (keyword: string) => storeApi.searchByName(keyword).then((res) => res.data),
  });

  const { mutateAsync: uploadProofImage, isPending: isUploadingImage } =
    useMutation({
      mutationFn: async (uri: string) => {
        const fileName = inferFileNameFromUri(uri);
        const mimeType = inferMimeTypeFromPath(fileName);
        const response = await uploadApi.uploadImage(uri, fileName, mimeType);
        return response.data.url;
      },
    });

  const { mutateAsync: submitForm, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const normalizedBizNo = businessRegistrationNumber.replace(/[^0-9]/g, '');

      if (!selectedStore) {
        throw new Error('매장을 선택해주세요.');
      }
      if (!ownerName.trim()) {
        throw new Error('사장명을 입력해주세요.');
      }
      if (!ownerPhone.trim()) {
        throw new Error('연락처를 입력해주세요.');
      }
      if (normalizedBizNo.length !== 10) {
        throw new Error('사업자등록번호 10자리를 입력해주세요.');
      }
      if (!proofImageUrl) {
        throw new Error('증빙이미지를 업로드해주세요.');
      }

      const payload = {
        storeId: selectedStore.id,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        businessRegistrationNumber: normalizedBizNo,
        proofImageUrl,
      };

      if (isEditMode) {
        return await ownerApi.updateMyApplication(payload);
      }
      return await ownerApi.createMyApplication(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['owner', 'me'] });
      Alert.alert(
        '완료',
        isEditMode
          ? '사장 등록 정보가 수정되었습니다. 재심사가 진행됩니다.'
          : '사장 등록 신청이 접수되었습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }],
      );
    },
  });

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleStoreSearch = useCallback(async () => {
    const keyword = storeKeyword.trim();
    if (!keyword) {
      Alert.alert('안내', '매장명을 입력해주세요.');
      return;
    }
    try {
      const results = await searchStores(keyword);
      setStoreResults(results);
    } catch {
      Alert.alert('오류', '매장 검색에 실패했습니다.');
    }
  }, [searchStores, storeKeyword]);

  const handleSelectStore = useCallback((store: StoreResponse) => {
    setSelectedStore(store);
  }, []);

  const handlePickProofImage = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      },
      async (result) => {
        if (result.didCancel) {
          return;
        }

        const asset = result.assets?.[0];
        if (!asset?.uri) {
          Alert.alert('오류', '이미지를 선택하지 못했습니다.');
          return;
        }

        try {
          const uploadedUrl = await uploadProofImage(asset.uri);
          setProofImageUrl(uploadedUrl);
          setProofImageLocalUri(asset.uri);
        } catch {
          Alert.alert('오류', '증빙이미지 업로드에 실패했습니다.');
        }
      },
    );
  }, [uploadProofImage]);

  const handleSubmit = useCallback(async () => {
    try {
      await submitForm();
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message =
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : '요청 처리에 실패했습니다.';
        Alert.alert('오류', message);
        return;
      }

      if (error instanceof Error) {
        Alert.alert('입력 오류', error.message);
        return;
      }

      Alert.alert('오류', '요청 처리에 실패했습니다.');
    }
  }, [submitForm]);

  const submitDisabled = useMemo(
    () => isSubmitting || isUploadingImage,
    [isSubmitting, isUploadingImage],
  );

  if (isEditMode && isApplicationLoading) {
    return (
      <View
        style={[styles.loadingContainer, { paddingTop: insets.top }]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isEditMode && (isApplicationError || !existingApplication)) {
    const notFound =
      isAxiosError(applicationError) && applicationError.response?.status === 404;

    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorTextInline}>
          {notFound
            ? '수정할 사장 등록 신청 정보가 없습니다.'
            : '사장 등록 정보를 불러오지 못했습니다.'}
        </Text>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Text style={styles.backActionButtonText}>뒤로가기</Text>
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
          {isEditMode ? '사장 등록 수정' : '사장 등록 신청'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={storeResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.storeResultItem,
              selectedStore?.id === item.id && styles.storeResultItemActive,
            ]}
            onPress={() => handleSelectStore(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} 선택`}
          >
            <Text style={styles.storeResultName}>{item.name}</Text>
            <Text style={styles.storeResultAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <Text style={styles.label}>매장 검색</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                value={storeKeyword}
                onChangeText={setStoreKeyword}
                placeholder="매장명을 입력하세요"
                placeholderTextColor={colors.gray400}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleStoreSearch}
                disabled={isSearchingStores}
              >
                {isSearchingStores ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.searchButtonText}>검색</Text>
                )}
              </TouchableOpacity>
            </View>

            {selectedStore ? (
              <View style={styles.selectedStoreBox}>
                <Text style={styles.selectedStoreTitle}>선택된 매장</Text>
                <Text style={styles.selectedStoreName}>{selectedStore.name}</Text>
                <Text style={styles.selectedStoreAddress}>
                  {selectedStore.address}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>사장명</Text>
            <TextInput
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="사장명을 입력하세요"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.label}>연락처</Text>
            <TextInput
              style={styles.input}
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              placeholder="연락처를 입력하세요"
              keyboardType="phone-pad"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.label}>사업자등록번호</Text>
            <TextInput
              style={styles.input}
              value={businessRegistrationNumber}
              onChangeText={setBusinessRegistrationNumber}
              placeholder="숫자 10자리를 입력하세요"
              keyboardType="number-pad"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.label}>증빙이미지</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickProofImage}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.uploadButtonText}>이미지 선택 및 업로드</Text>
              )}
            </TouchableOpacity>

            {proofImageLocalUri ? (
              <Image
                source={{ uri: proofImageLocalUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitDisabled}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? '수정 요청하기' : '신청하기'}
            >
              <Text style={styles.submitButtonText}>
                {isEditMode ? '수정 요청하기' : '신청하기'}
              </Text>
            </TouchableOpacity>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySm,
    fontWeight: '700' as const,
    color: colors.black,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },
  searchButton: {
    width: 72,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    ...typography.bodySm,
    color: colors.white,
    fontWeight: '700' as const,
  },
  selectedStoreBox: {
    borderWidth: spacing.borderThin,
    borderColor: colors.primary,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.sm,
  },
  selectedStoreTitle: {
    ...typography.captionBold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  selectedStoreName: {
    ...typography.body,
    color: colors.black,
    fontWeight: '700' as const,
  },
  selectedStoreAddress: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  storeResultItem: {
    borderWidth: spacing.borderThin,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  storeResultItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeResultName: {
    ...typography.body,
    fontWeight: '700' as const,
    color: colors.black,
  },
  storeResultAddress: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  uploadButton: {
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    ...typography.bodySm,
    color: colors.white,
    fontWeight: '700' as const,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: spacing.radiusMd,
    marginTop: spacing.sm,
  },
  submitButton: {
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.black,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },
  errorTextInline: {
    ...typography.body,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  backActionButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backActionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },
});

export default OwnerApplicationFormScreen;
