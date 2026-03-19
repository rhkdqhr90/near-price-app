import { apiClient } from './client';
import type { ReactionResponse } from '../types/api.types';

interface CreateReportDto {
  reason: string;
}

export const reactionApi = {
  confirm: (priceId: string) =>
    apiClient.post<void>(`/price/${priceId}/confirm`),
  report: (priceId: string, dto: CreateReportDto) =>
    apiClient.post<void>(`/price/${priceId}/report`, dto),
  getReactions: (priceId: string) =>
    apiClient.get<ReactionResponse>(`/price/${priceId}/reactions`),
};
