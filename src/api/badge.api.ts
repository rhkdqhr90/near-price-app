import { apiClient } from './client';
import type { UserBadgesResponse } from '../types/api.types';

export const badgeApi = {
  /**
   * 사용자의 뱃지 목록 조회 (획득한 뱃지 + 진행 중인 뱃지)
   */
  getUserBadges: (userId: string) =>
    apiClient.get<UserBadgesResponse>(
      `/users/${userId}/badges`,
    ),
};
