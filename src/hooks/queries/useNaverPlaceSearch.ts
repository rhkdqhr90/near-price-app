import { useQuery } from '@tanstack/react-query';
import { naverLocalApi, type NaverPlaceDocument } from '../../api/naver-local.api';

export const useNaverPlaceSearch = (query: string, enabled: boolean, regionHint?: string) =>
  useQuery({
    queryKey: ['naverPlaceSearch', query, regionHint ?? ''],
    queryFn: () => naverLocalApi.searchKeyword(query, regionHint),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

export type { NaverPlaceDocument };
