import { apiClient } from './client';
import type {
  CreateFlyerDto,
  FlyerResponse,
  OwnerPostResponse,
  UpdateFlyerDto,
} from '../types/api.types';

export const flyerApi = {
  getAll: () =>
    apiClient.get<FlyerResponse[]>('/flyer'),

  getOne: (id: string) =>
    apiClient.get<FlyerResponse>(`/flyer/${id}`),

  getOwnerPosts: () =>
    apiClient.get<OwnerPostResponse[]>('/flyer/owner-posts/list'),

  getMyFlyers: () =>
    apiClient.get<FlyerResponse[]>('/flyer/my'),

  createMyFlyer: (dto: CreateFlyerDto) =>
    apiClient.post<FlyerResponse>('/flyer/my', dto),

  updateMyFlyer: (flyerId: string, dto: UpdateFlyerDto) =>
    apiClient.patch<FlyerResponse>(`/flyer/my/${flyerId}`, dto),

  deleteMyFlyer: (flyerId: string) =>
    apiClient.delete<void>(`/flyer/my/${flyerId}`),

  trackProductView: (flyerId: string, productId: string) =>
    apiClient.post<void>(`/flyer/${flyerId}/product/${productId}/view`),
};
