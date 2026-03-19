import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../api/store.api';
import type { StoreResponse } from '../../types/api.types';

export const storeKeys = {
  detail: (id: string) => ['store', id] as const,
};

export const useStoreDetail = (storeId: string) => {
  return useQuery<StoreResponse>({
    queryKey: storeKeys.detail(storeId),
    queryFn: () => storeApi.getOne(storeId).then((res) => res.data),
    enabled: storeId.length > 0,
  });
};
