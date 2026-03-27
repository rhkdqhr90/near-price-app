import { apiClient } from './client';
import { vworldApi } from './vworld.api';
import { naverMapsApi } from './naver-maps.api';

// LocationSetupScreen 주소 검색 결과 형식
export interface NaverGeocodeResult {
  roadAddress: string;
  jibunAddress: string;
  x: string; // longitude
  y: string; // latitude
}

// ─── Naver Search API — 백엔드 프록시 (/naver/search) 경유 ────────────────

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
  // 1순위: Naver Reverse Geocoding (NCP Maps API)
  // 2순위: Vworld (국토교통부, 심사 불필요)
  coord2Region: async (longitude: number, latitude: number): Promise<string | null> => {
    try {
      const res = await naverMapsApi.reverseGeocode(longitude, latitude);
      const result = res.data.results?.[0];
      const area3 = result?.region?.area3?.name;
      const area2 = result?.region?.area2?.name;
      if (area3) return area2 ? `${area2} ${area3}` : area3;
      throw new Error('no region data');
    } catch {
      // Naver 실패 시 Vworld 폴백
      try {
        return await vworldApi.reverseGeocode(longitude, latitude);
      } catch {
        return null;
      }
    }
  },

  // 주소/동 이름 검색: 텍스트 → 좌표 목록 (Naver Geocoding API)
  // roadAddress: 목록 표시용 전체 주소 / jibunAddress: 저장용 지번 주소
  searchAddress: async (query: string): Promise<NaverGeocodeResult[]> => {
    const res = await naverMapsApi.geocode(query);
    return (res.data.addresses ?? []).map(item => ({
      roadAddress: item.roadAddress,
      jibunAddress: item.jibunAddress,
      x: item.x,
      y: item.y,
    }));
  },

  searchKeyword: async (query: string, regionHint?: string): Promise<NaverPlaceDocument[]> => {
    // regionHint가 있으면 검색어에 동네 이름 추가 (위치 기반 검색 효과)
    const searchQuery = regionHint ? `${regionHint} ${query}` : query;
    const res = await apiClient.get<NaverLocalResponse>('/naver/search', {
      params: { query: searchQuery, display: 10, sort: 'random' },
    });
    return (res.data.items ?? []).map((item, index) => {
      // Naver Search API mapx/mapy는 소수점 없는 정수 (경도/위도 × 1e7)
      const lng = (parseInt(item.mapx, 10) / 1e7).toFixed(7);
      const lat = (parseInt(item.mapy, 10) / 1e7).toFixed(7);
      const name = item.title.replace(/<[^>]*>/g, '');
      return {
        id: `${index}_${name}_${lng}_${lat}`,
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
