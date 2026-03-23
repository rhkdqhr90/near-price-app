import axios from 'axios';
import { NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET } from '../utils/config';
import { vworldApi } from './vworld.api';
import { kakaoApi } from './kakao.api';

// ─── Nominatim (OpenStreetMap) — 주소 검색 전용 ─────────────────────

const nominatimClient = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10000,
  headers: { 'User-Agent': 'NearPriceApp/1.0 (contact@nearprice.kr)' },
});

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
}

// LocationSetupScreen 주소 검색 결과 형식
export interface NaverGeocodeResult {
  roadAddress: string;
  jibunAddress: string;
  x: string; // longitude
  y: string; // latitude
}

// ─── Naver Search API (openapi.naver.com) — 장소 검색 ─────────────────────

const naverSearchClient = axios.create({
  baseURL: 'https://openapi.naver.com/v1',
  timeout: 10000,
  headers: {
    'X-Naver-Client-Id': NAVER_SEARCH_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_SEARCH_CLIENT_SECRET,
  },
});

export interface NaverPlaceDocument {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  x: string; // longitude
  y: string; // latitude
  distance?: string;
}

interface NaverLocalItem {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string; // longitude * 1e7
  mapy: string; // latitude * 1e7
}

interface NaverLocalResponse {
  items: NaverLocalItem[];
}

export const naverLocalApi = {
  // 역지오코딩: 좌표 → 동 이름 변환
  // 1순위: Vworld (국토교통부, 심사 불필요)
  // 2순위: 카카오 (카카오맵 심사 통과 후 활성화)
  coord2Region: async (longitude: number, latitude: number): Promise<string | null> => {
    try {
      return await vworldApi.reverseGeocode(longitude, latitude);
    } catch {
      // Vworld 실패 시 카카오 폴백
      try {
        return await kakaoApi.reverseGeocode(longitude, latitude);
      } catch {
        return null;
      }
    }
  },

  // 주소/동 이름 검색: 텍스트 → 좌표 목록 (Nominatim)
  // roadAddress: 목록 표시용 전체 주소 / jibunAddress: 저장용 동 이름(첫 번째 토큰)
  searchAddress: async (query: string): Promise<NaverGeocodeResult[]> => {
    const res = await nominatimClient.get<NominatimSearchItem[]>('/search.php', {
      params: { q: query, countrycodes: 'kr', format: 'json', 'accept-language': 'ko', limit: 10 },
    });
    return res.data.map(item => ({
      roadAddress: item.display_name,
      jibunAddress: item.display_name.split(',')[0].trim(),
      x: item.lon,
      y: item.lat,
    }));
  },

  searchKeyword: async (query: string, regionHint?: string): Promise<NaverPlaceDocument[]> => {
    // regionHint가 있으면 검색어에 동네 이름 추가 (위치 기반 검색 효과)
    const searchQuery = regionHint ? `${regionHint} ${query}` : query;
    const res = await naverSearchClient.get<NaverLocalResponse>('/search/local.json', {
      params: { query: searchQuery, display: 10, sort: 'random' },
    });
    return res.data.items.map((item) => {
      // Naver Search API mapx/mapy는 소수점 없는 정수 (경도/위도 × 1e7)
      const lng = (parseInt(item.mapx, 10) / 1e7).toFixed(7);
      const lat = (parseInt(item.mapy, 10) / 1e7).toFixed(7);
      const name = item.title.replace(/<[^>]*>/g, '');
      return {
        id: `${name}_${lng}_${lat}`,
        name,
        category: item.category,
        address: item.address,
        roadAddress: item.roadAddress,
        x: lng,
        y: lat,
      };
    });
  },
};
