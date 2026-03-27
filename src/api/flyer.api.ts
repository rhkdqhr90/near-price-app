import { apiClient } from './client';
import type { FlyerResponse, OwnerPostResponse } from '../types/api.types';

export const flyerApi = {
  getAll: () =>
    apiClient.get<FlyerResponse[]>('/flyer'),

  getOne: (id: string) =>
    apiClient.get<FlyerResponse>(`/flyer/${id}`),

  getOwnerPosts: () =>
    apiClient.get<OwnerPostResponse[]>('/flyer/owner-posts/list'),
};
