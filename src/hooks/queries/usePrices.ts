import { useQuery } from '@tanstack/react-query';
import { priceApi } from '../../api/price.api';
import type { PriceResponse } from '../../types/api.types';

export const priceKeys = {
  all: ['prices'] as const,
  recent: ['prices', 'recent'] as const,
  byProduct: (productId: string) => ['prices', 'product', productId] as const,
  byName: (name: string) => ['prices', 'byName', name] as const,
  mine: ['prices', 'my'] as const,
};

export const useProductPrices = (productId: string) => {
  return useQuery<PriceResponse[]>({
    queryKey: priceKeys.byProduct(productId),
    queryFn: () => priceApi.getByProduct(productId).then(res => res.data),
    enabled: productId.length > 0,
  });
};

// 상품명 기준 가격 조회 (같은 이름의 모든 상품 가격을 합쳐서 반환)
export const useProductPricesByName = (productName: string) => {
  return useQuery<PriceResponse[]>({
    queryKey: priceKeys.byName(productName),
    queryFn: () => priceApi.getByProductName(productName).then(res => res.data),
    enabled: productName.trim().length > 0,
  });
};

export const useRecentPrices = () => {
  return useQuery<PriceResponse[]>({
    queryKey: priceKeys.recent,
    queryFn: () => priceApi.getRecent().then(res => res.data),
  });
};

export const useMyPrices = () => {
  return useQuery<PriceResponse[]>({
    queryKey: priceKeys.mine,
    queryFn: () => priceApi.getMy().then(res => res.data),
  });
};
