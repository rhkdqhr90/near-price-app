import { useQuery } from '@tanstack/react-query';
import { naverLocalApi, type NaverPlaceDocument } from '../../api/naver-local.api';

export const useNaverPlaceSearch = (query: string, enabled: boolean) =>
  useQuery({
    queryKey: ['naverPlaceSearch', query],
    queryFn: () => naverLocalApi.searchKeyword(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

export type { NaverPlaceDocument };
