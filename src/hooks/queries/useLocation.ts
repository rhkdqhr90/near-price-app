import { useQuery } from '@tanstack/react-query';
import { naverLocalApi, type NaverGeocodeResult } from '../../api/naver-local.api';

export const locationKeys = {
  region: (lng: number | null, lat: number | null) => ['location', 'region', lng, lat] as const,
  geocode: (query: string) => ['location', 'geocode', query] as const,
};

// Nominatim 역지오코딩: 좌표 → 동 이름
export const useReverseGeocode = (longitude: number | null, latitude: number | null) => {
  return useQuery({
    queryKey: locationKeys.region(longitude, latitude),
    queryFn: async () => {
      if (longitude === null || latitude === null) return null;
      return naverLocalApi.coord2Region(longitude, latitude);
    },
    enabled: longitude !== null && latitude !== null,
    staleTime: 1000 * 60 * 10,
  });
};

// Nominatim 주소 검색: 텍스트 → NaverGeocodeResult[]
export const useGeocodeSearch = (query: string) => {
  return useQuery({
    queryKey: locationKeys.geocode(query),
    queryFn: (): Promise<NaverGeocodeResult[]> => naverLocalApi.searchAddress(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};
