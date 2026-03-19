import { apiClient } from './client';
import type { WishlistResponse } from '../types/api.types';

export const wishlistApi = {
  getMyList: () =>
    apiClient.get<WishlistResponse>('/wishlists/me'),

  add: (productId: string) =>
    apiClient.post('/wishlists', { productId }),

  remove: (productId: string) =>
    apiClient.delete(`/wishlists/${productId}`),
};
