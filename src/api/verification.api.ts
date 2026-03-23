import { apiClient } from './client';
import type {
  CreateVerificationDto,
  VerificationResponse,
  VerificationListResponse,
  PriceTrustScoreResponse,
  UserTrustScoreResponse,
} from '../types/api.types';

export const verificationApi = {
  /**
   * 가격 검증 생성 (맞아요/달라요)
   */
  createVerification: (priceId: string, dto: CreateVerificationDto) =>
    apiClient.post<VerificationResponse>(
      `/prices/${priceId}/verifications`,
      dto,
    ),

  /**
   * 특정 가격의 검증 목록 조회
   */
  getVerifications: (priceId: string, page = 1, limit = 10) =>
    apiClient.get<VerificationListResponse>(
      `/prices/${priceId}/verifications?page=${page}&limit=${limit}`,
    ),

  /**
   * 특정 가격의 신뢰도 점수 조회
   */
  getPriceTrustScore: (priceId: string) =>
    apiClient.get<PriceTrustScoreResponse>(
      `/prices/${priceId}/trust-score`,
    ),
};

export const trustScoreApi = {
  /**
   * 사용자 신뢰도 조회
   */
  getUserTrustScore: (userId: string) =>
    apiClient.get<UserTrustScoreResponse>(
      `/users/${userId}/trust-score`,
    ),
};
