import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoreType } from '../types/api.types';

const STORAGE_KEY = 'custom_store_types';

const DEFAULT_STORE_TYPES: { label: string; value: StoreType; isDefault: boolean }[] = [
  { label: '마트', value: 'mart', isDefault: true },
  { label: '시장', value: 'traditional_market', isDefault: true },
  { label: '슈퍼', value: 'supermarket', isDefault: true },
  { label: '편의점', value: 'convenience', isDefault: true },
  { label: '대형마트', value: 'large_mart', isDefault: true },
];

interface StorageItem {
  label: string;
  value: string;
  isDefault: boolean;
  createdAt: string;
}

export const useStoreTypes = () => {
  const [storeTypes, setStoreTypes] = useState<{ label: string; value: StoreType; isDefault: boolean }[]>(
    DEFAULT_STORE_TYPES,
  );
  const [isLoading, setIsLoading] = useState(true);

  // 스토리지에서 커스텀 카테고리 로드
  useEffect(() => {
    const loadStoreTypes = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const customTypes: StorageItem[] = JSON.parse(stored);
          const merged = [
            ...DEFAULT_STORE_TYPES,
            ...customTypes.map(ct => ({
              label: ct.label,
              value: ct.value as StoreType,
              isDefault: false,
            })),
          ];
          setStoreTypes(merged);
        } else {
          setStoreTypes(DEFAULT_STORE_TYPES);
        }
      } catch (error) {
        if (__DEV__) { console.error('Failed to load store types:', error); }
        setStoreTypes(DEFAULT_STORE_TYPES);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStoreTypes();
  }, []);

  // 새 카테고리 추가
  const addStoreType = useCallback(async (label: string): Promise<boolean> => {
    try {
      const trimmed = label.trim();
      if (!trimmed) return false;

      // 중복 확인
      if (storeTypes.some(st => st.label === trimmed)) {
        return false;
      }

      const customValue = `custom_${Date.now()}`;
      const newType = { label: trimmed, value: customValue as StoreType, isDefault: false };

      // 스토리지 업데이트
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const customTypes: StorageItem[] = stored ? JSON.parse(stored) : [];
      customTypes.push({
        label: trimmed,
        value: customValue,
        isDefault: false,
        createdAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customTypes));

      // 상태 업데이트
      setStoreTypes(prev => [...prev, newType]);
      return true;
    } catch (error) {
      if (__DEV__) { console.error('Failed to add store type:', error); }
      return false;
    }
  }, [storeTypes]);

  // 커스텀 카테고리 삭제
  const removeStoreType = useCallback(async (value: string): Promise<boolean> => {
    try {
      // 기본 카테고리는 삭제 불가
      if (DEFAULT_STORE_TYPES.some(dt => dt.value === value)) {
        return false;
      }

      // 스토리지 업데이트
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customTypes: StorageItem[] = JSON.parse(stored);
        const filtered = customTypes.filter(ct => ct.value !== value);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }

      // 상태 업데이트
      setStoreTypes(prev => prev.filter(st => st.value !== value));
      return true;
    } catch (error) {
      if (__DEV__) { console.error('Failed to remove store type:', error); }
      return false;
    }
  }, []);

  return {
    storeTypes,
    isLoading,
    addStoreType,
    removeStoreType,
  };
};
