import { create } from 'zustand';
import type { UnitType } from '../types/api.types';

export interface ConfirmItem {
  key?: string;
  productId?: string;
  productName: string;
  price: number;
  unitType?: UnitType;
  quantity?: number;
  imageUri?: string;
  condition?: string;
  quality?: 'HIGH' | 'MID' | 'LOW';
  memo?: string;
  eventStart?: string;
  eventEnd?: string;
}

interface PriceRegisterState {
  storeId: string | null;
  storeName: string | null;
  items: ConfirmItem[];
  setStore: (storeId: string, storeName: string) => void;
  addItem: (item: ConfirmItem) => void;
  updateItem: (index: number, item: ConfirmItem) => void;
  removeItem: (index: number) => void;
  reset: () => void;
}

export const usePriceRegisterStore = create<PriceRegisterState>((set) => ({
  storeId: null,
  storeName: null,
  items: [],
  setStore: (storeId, storeName) => set({ storeId, storeName }),
  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, key: `${Date.now()}-${state.items.length}` }],
  })),
  updateItem: (index, item) =>
    set((state) => {
      const items = [...state.items];
      items[index] = { ...item, key: items[index]?.key };
      return { items };
    }),
  removeItem: (index) =>
    set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
  reset: () => set({ storeId: null, storeName: null, items: [] }),
}));
