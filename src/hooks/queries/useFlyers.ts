import { useQuery } from '@tanstack/react-query';
import { flyerApi } from '../../api/flyer.api';
import type { FlyerResponse, OwnerPostResponse } from '../../types/api.types';

export const flyerKeys = {
  all: ['flyers'] as const,
  detail: (id: string) => ['flyers', id] as const,
  ownerPosts: ['flyers', 'owner-posts'] as const,
};

export const useFlyers = () => {
  return useQuery<FlyerResponse[]>({
    queryKey: flyerKeys.all,
    queryFn: () => flyerApi.getAll().then(res => res.data),
  });
};

export const useFlyerDetail = (id: string) => {
  return useQuery<FlyerResponse>({
    queryKey: flyerKeys.detail(id),
    queryFn: () => flyerApi.getOne(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useOwnerPosts = () => {
  return useQuery<OwnerPostResponse[]>({
    queryKey: flyerKeys.ownerPosts,
    queryFn: () => flyerApi.getOwnerPosts().then(res => res.data),
  });
};
