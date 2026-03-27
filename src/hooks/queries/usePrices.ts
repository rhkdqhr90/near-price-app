import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { priceApi } from '../../api/price.api';
import type { PaginatedResponse, PriceResponse, ProductPriceCard } from '../../types/api.types';

export const priceKeys = {
  all: ['prices'] as const,
  detail: (priceId: string) => ['prices', 'detail', priceId] as const,
  recent: ['prices', 'recent'] as const,
  byProduct: (productId: string) => ['prices', 'product', productId] as const,
  byName: (name: string) => ['prices', 'byName', name] as const,
  mine: ['prices', 'my'] as const,
};

export const usePriceDetail = (priceId: string) => {
  return useQuery<PriceResponse>({
    queryKey: priceKeys.detail(priceId),
    queryFn: () => priceApi.getOne(priceId).then(res => res.data),
    enabled: priceId.length > 0,
  });
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

export const useInfiniteRecentPrices = () => {
  return useInfiniteQuery<PaginatedResponse<ProductPriceCard>>({
    queryKey: priceKeys.recent,
    queryFn: ({ pageParam }) => priceApi.getRecent(pageParam as number, 20).then(res => res.data),
    getNextPageParam: (lastPage) =>
      lastPage.data.length === lastPage.limit ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

export const useMyPrices = () => {
  return useQuery<PriceResponse[]>({
    queryKey: priceKeys.mine,
    queryFn: () => priceApi.getMy().then(res => res.data.data),
  });
};

export const useDeleteMyPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (priceId: string) => priceApi.remove(priceId).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: priceKeys.mine });
    },
  });
};
