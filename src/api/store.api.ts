import { apiClient } from './client';
import type { StoreResponse, CreateStoreDto, NearbyStoreResponse } from '../types/api.types';

export const storeApi = {
  getAll: () =>
    apiClient.get<StoreResponse[]>('/store'),

  getOne: (id: string) =>
    apiClient.get<StoreResponse>(`/store/${id}`),

  getByExternalId: (externalPlaceId: string) =>
    apiClient.get<StoreResponse>(`/store/by-external/${externalPlaceId}`),

  getNearby: (lat: number, lng: number, radius?: number) =>
    apiClient.get<NearbyStoreResponse[]>('/store/nearby', {
      params: { lat, lng, radius: radius ?? 3000 },
    }),

  searchByName: (name: string) =>
    apiClient.get<StoreResponse[]>('/store/search', { params: { name } }),

  create: (dto: CreateStoreDto) =>
    apiClient.post<StoreResponse>('/store', dto),
};
