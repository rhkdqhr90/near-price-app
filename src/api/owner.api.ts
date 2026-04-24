import { apiClient } from './client';
import type {
  CreateOwnerApplicationDto,
  OwnerApplicationResponse,
  UpdateOwnerApplicationDto,
} from '../types/api.types';

export const ownerApi = {
  getMyApplication: () =>
    apiClient.get<OwnerApplicationResponse>('/owner/me'),

  createMyApplication: (dto: CreateOwnerApplicationDto) =>
    apiClient.post<OwnerApplicationResponse>('/owner/me', dto),

  updateMyApplication: (dto: UpdateOwnerApplicationDto) =>
    apiClient.patch<OwnerApplicationResponse>('/owner/me', dto),

  deleteMyApplication: () =>
    apiClient.delete<void>('/owner/me'),
};
