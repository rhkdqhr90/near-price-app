import { apiClient } from './client';
import type {
  ProductResponse,
  CreateProductDto,
  SearchProductResult,
} from '../types/api.types';

export const productApi = {
  getAll: (search?: string) =>
    apiClient.get<ProductResponse[]>('/product', {
      params: search ? { search } : undefined,
    }),

  getOne: (id: string) =>
    apiClient.get<ProductResponse>(`/product/${id}`),

  create: (dto: CreateProductDto) =>
    apiClient.post<ProductResponse>('/product', dto),

  searchProducts: (q: string, limit?: number) =>
    apiClient.get<SearchProductResult[]>('/product/search', {
      params: { q, ...(limit !== undefined && { limit }) },
    }),
};
