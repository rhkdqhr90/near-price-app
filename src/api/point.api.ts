import { apiClient } from './client';
import type {
  PointSummaryResponse,
  PointTransactionListResponse,
} from '../types/api.types';

export const pointApi = {
  getMySummary: () =>
    apiClient.get<PointSummaryResponse>('/points/me/summary'),

  getMyTransactions: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<PointTransactionListResponse>('/points/me/transactions', {
      params,
    }),
};
