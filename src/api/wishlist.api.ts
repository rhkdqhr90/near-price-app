import { apiClient } from './client';
import type { WishlistResponse } from '../types/api.types';

export const wishlistApi = {
  getMyList: () =>
    apiClient.get<WishlistResponse>('/wishlists/me'),

  add: (productId: string) =>
    apiClient.post<void>('/wishlists', { productId }),

  remove: (productId: string) =>
    apiClient.delete<void>(`/wishlists/${productId}`),
};
