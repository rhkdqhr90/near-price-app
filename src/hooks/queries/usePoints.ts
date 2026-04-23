import { useQuery } from '@tanstack/react-query';
import { pointApi } from '../../api/point.api';
import { useAuthStore } from '../../store/authStore';
import type { PointSummaryResponse } from '../../types/api.types';

export const pointKeys = {
  all: ['points'] as const,
  summary: ['points', 'summary'] as const,
};

export const useMyPointSummary = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PointSummaryResponse>({
    queryKey: pointKeys.summary,
    queryFn: () => pointApi.getMySummary().then((res) => res.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
};
