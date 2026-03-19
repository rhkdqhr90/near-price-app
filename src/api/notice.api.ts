import { apiClient } from './client';
import type { NoticeResponse } from '../types/api.types';

export type { NoticeResponse };

export const noticeApi = {
  getAll: () =>
    apiClient.get<NoticeResponse[]>('/notice'),

  getById: (id: string) =>
    apiClient.get<NoticeResponse>(`/notice/${id}`),
};
