import { apiClient } from './client';

export interface NaverRegionResult {
  code: { id: string; type: string; mappingId: string };
  region: {
    area0: { name: string };
    area1: { name: string }; // 시도
    area2: { name: string }; // 구군
    area3: { name: string }; // 동
    area4: { name: string }; // 리
  };
}

export interface NaverGeocodeItem {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string; // longitude
  y: string; // latitude
}

export interface NcpPlaceItem {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  x: string; // longitude
  y: string; // latitude
}

// 백엔드 프록시 응답 타입 (직접 Naver API 호출 아님 — apiClient 사용이 올바름)
export interface NaverReverseGeocodeResponse {
  status: { code: number; name: string; message: string };
  results: NaverRegionResult[];
}

export interface NaverGeocodeResponse {
  status: string;
  meta: { totalCount: number };
  addresses: NaverGeocodeItem[];
}

export const naverMapsApi = {
  // 역지오코딩: 좌표 → 주소 (백엔드 프록시 경유)
  reverseGeocode: (longitude: number, latitude: number) =>
    apiClient.get<NaverReverseGeocodeResponse>('/naver/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
    }),

  // 지오코딩: 주소 텍스트 → 좌표 (백엔드 프록시 경유)
  geocode: (query: string) =>
    apiClient.get<NaverGeocodeResponse>('/naver/geocode', { params: { query } }),
};
