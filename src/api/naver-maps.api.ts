import axios from 'axios';
import { NAVER_MAP_CLIENT_ID, NAVER_MAP_CLIENT_SECRET, NAVER_MAPS_API_BASE } from '../utils/config';

const naverMapsClient = axios.create({
  baseURL: NAVER_MAPS_API_BASE,
  timeout: 10000,
  headers: {
    'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_CLIENT_ID,
    'X-NCP-APIGW-API-KEY': NAVER_MAP_CLIENT_SECRET,
  },
});

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

export const naverMapsApi = {
  // 역지오코딩: 좌표 → 주소
  reverseGeocode: (longitude: number, latitude: number) =>
    naverMapsClient.get<{
      status: { code: number; name: string; message: string };
      results: NaverRegionResult[];
    }>(
      '/map-reversegeocode/v2/gc',
      { params: { coords: `${longitude},${latitude}`, output: 'json', orders: 'admcode' } },
    ),

  // 지오코딩: 주소 텍스트 → 좌표
  geocode: (query: string) =>
    naverMapsClient.get<{
      status: string;
      meta: { totalCount: number };
      addresses: NaverGeocodeItem[];
    }>(
      '/map-geocode/v2/geocode',
      { params: { query } },
    ),

  // 장소 검색: 키워드 → 주변 매장 목록 (NCP Map Place API)
  placeSearch: (query: string, lng: number, lat: number) =>
    naverMapsClient.get<{ status: string; places?: NcpPlaceItem[] }>(
      '/map-place/v1/search',
      { params: { query, coordinate: `${lng},${lat}`, radius: 5000, language: 'ko' } },
    ),
};
