import { apiClient } from './client';
import type { PriceResponse, CreatePriceDto, UpdatePriceDto, PaginatedResponse, ProductPriceCard } from '../types/api.types';

export const priceApi = {
  getRecent: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<ProductPriceCard>>('/price/recent', { params: { page, limit } }),

  getByProduct: (productId: string) =>
    apiClient.get<PriceResponse[]>(`/price/product/${productId}`),

  getByProductName: (name: string) =>
    apiClient.get<PriceResponse[]>('/price/by-name', { params: { name } }),

  getAll: () =>
    apiClient.get<PriceResponse[]>('/price'),

  getMy: () =>
    apiClient.get<PaginatedResponse<PriceResponse>>('/price/my'),

  getOne: (id: string) =>
    apiClient.get<PriceResponse>(`/price/${id}`),

  create: (dto: CreatePriceDto) =>
    apiClient.post<PriceResponse>('/price', dto),

  update: (id: string, dto: UpdatePriceDto) =>
    apiClient.patch<PriceResponse>(`/price/${id}`, dto),

  remove: (id: string) =>
    apiClient.delete(`/price/${id}`),
};
