import { apiClient } from './client';
import type { FaqItemResponse, FaqGroupResponse } from '../types/api.types';

export type { FaqItemResponse, FaqGroupResponse };

export const faqApi = {
  getAll: () =>
    apiClient.get<FaqGroupResponse[]>('/faq'),
};
