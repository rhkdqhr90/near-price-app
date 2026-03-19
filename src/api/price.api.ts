import { apiClient } from './client';
import type { PriceResponse, CreatePriceDto, UpdatePriceDto } from '../types/api.types';

export const priceApi = {
  getRecent: () =>
    apiClient.get<PriceResponse[]>('/price/recent'),

  getByProduct: (productId: string) =>
    apiClient.get<PriceResponse[]>(`/price/product/${productId}`),

  getAll: () =>
    apiClient.get<PriceResponse[]>('/price'),

  getMy: () =>
    apiClient.get<PriceResponse[]>('/price/my'),

  getOne: (id: string) =>
    apiClient.get<PriceResponse>(`/price/${id}`),

  create: (dto: CreatePriceDto) =>
    apiClient.post<PriceResponse>('/price', dto),

  update: (id: string, dto: UpdatePriceDto) =>
    apiClient.patch<PriceResponse>(`/price/${id}`, dto),

  remove: (id: string) =>
    apiClient.delete(`/price/${id}`),
};
