import { useQuery } from '@tanstack/react-query';
import { badgeApi } from '../../api/badge.api';
import { trustScoreApi } from '../../api/verification.api';
import type { UserBadgesResponse, UserTrustScoreResponse } from '../../types/api.types';

export const useUserBadges = (userId: string | undefined) =>
  useQuery<UserBadgesResponse>({
    queryKey: ['badges', userId],
    queryFn: () => badgeApi.getUserBadges(userId as string).then(r => r.data),
    enabled: !!userId,
  });

export const useUserTrustScore = (userId: string | undefined) =>
  useQuery<UserTrustScoreResponse>({
    queryKey: ['trustScore', userId],
    queryFn: () => trustScoreApi.getUserTrustScore(userId as string).then(r => r.data),
    enabled: !!userId,
  });
