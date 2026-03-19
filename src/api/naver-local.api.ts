import axios from 'axios';
import { NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET } from '../utils/config';

// ─── Nominatim (OpenStreetMap) — 역지오코딩, 키 불필요 ─────────────────────

const nominatimClient = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10000,
  headers: { 'User-Agent': 'NearPriceApp/1.0 (contact@nearprice.kr)' },
});

interface NominatimAddress {
  suburb?: string;
  quarter?: string;
  borough?: string;
  city_district?: string;
  neighbourhood?: string;
}

interface NominatimResponse {
  address: NominatimAddress;
}

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
  coord2Region: async (longitude: number, latitude: number): Promise<string | null> => {
    const res = await nominatimClient.get<NominatimResponse>('/reverse', {
      // zoom=17: 동/읍/면 수준 정밀도 (18=건물, 16=구)
      params: { format: 'json', lat: latitude, lon: longitude, 'accept-language': 'ko', zoom: 17 },
    });
    const addr = res.data.address;
    return addr.suburb ?? addr.quarter ?? addr.neighbourhood ?? addr.borough ?? addr.city_district ?? null;
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

  searchKeyword: async (query: string): Promise<NaverPlaceDocument[]> => {
    const res = await naverSearchClient.get<NaverLocalResponse>('/search/local.json', {
      params: { query, display: 5, sort: 'random' },
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
