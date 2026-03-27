import axios from 'axios';
import { VWORLD_API_KEY } from '../utils/config';

// Vworld Geocoder API 2.0 — 국토교통부 공공 역지오코딩
// https://www.vworld.kr/dev/v4dv_geocoderguide2_s001.do
const vworldClient = axios.create({
  baseURL: 'https://api.vworld.kr',
  timeout: 10000,
});

interface VworldAddressResult {
  text: string; // 전체 주소 (예: "경기도 수원시 영통구 매탄동 123-4")
  type?: string;
  zipcode?: string;
}

interface VworldAddressResponse {
  response: {
    status: string; // "OK" | "NOT_FOUND" | "ERROR"
    result?: VworldAddressResult[];
  };
}

/**
 * Vworld 좌표 역지오코딩: 경도/위도 → "구 동" 형식 문자열
 * - 지번 주소(PARCEL)에서 시/구/동 추출
 * - point 파라미터: "경도,위도" 형식
 */
export const vworldApi = {
  reverseGeocode: async (longitude: number, latitude: number): Promise<string | null> => {
    try {
      // VWORLD_API_KEY를 요청 시점에 읽어야 함 (모듈 로딩 시점엔 빈 문자열일 수 있음)
      const apiKey = VWORLD_API_KEY;
      if (!apiKey) {
        throw new Error('[vworldApi] VWORLD_API_KEY is empty — check .env');
      }
      const res = await vworldClient.get<VworldAddressResponse>(
        '/req/address',
        {
          params: {
            service: 'address',
            request: 'getAddress',
            version: '2.0',
            crs: 'epsg:4326',
            point: `${longitude},${latitude}`,
            format: 'json',
            type: 'PARCEL',
            zipcode: 'false',
            simple: 'false',
            key: apiKey,
          },
        },
      );

      const { status, result } = res.data.response;

      if (status === 'NOT_FOUND' || !result || result.length === 0) {
        return null;
      }

      // result[0].text = "경기도 수원시 영통구 매탄동 123-4" 같은 형태
      const fullAddress = result[0].text;
      if (!fullAddress) return null;

      // 주소에서 "구 동" 또는 "시 동" 추출
      const parts = fullAddress.split(' ').map(p => p.trim()).filter(Boolean);
      // parts 예: ["경기도", "수원시", "영통구", "매탄동", "123-4"]

      // 동/읍/면 찾기 (끝이 동/읍/면/리로 끝나는 파트)
      const dongIdx = parts.findIndex(p =>
        p.endsWith('동') || p.endsWith('읍') || p.endsWith('면') || p.endsWith('리'),
      );

      if (dongIdx >= 0) {
        const dong = parts[dongIdx];
        // 동 앞의 구/군 찾기
        const guIdx = parts.findIndex(p => p.endsWith('구') || p.endsWith('군'));
        if (guIdx >= 0 && guIdx < dongIdx) {
          return `${parts[guIdx]} ${dong}`;
        }
        // 구가 없으면 시 + 동
        const siIdx = parts.findIndex(p => p.endsWith('시'));
        if (siIdx >= 0 && siIdx < dongIdx) {
          return `${parts[siIdx]} ${dong}`;
        }
        return dong;
      }

      // 동을 못 찾으면 구 반환
      const guPart = parts.find(p => p.endsWith('구') || p.endsWith('군'));
      if (guPart) {
        const siPart = parts.find(p => p.endsWith('시'));
        if (siPart) return `${siPart} ${guPart}`;
        return guPart;
      }

      // 최소한 시라도 반환
      const siPart = parts.find(p => p.endsWith('시'));
      if (siPart) return siPart;

      return null;
    } catch (error) {
      if (__DEV__) { console.error('[vworldApi.reverseGeocode] Error:', error); }
      throw error;
    }
  },

  /** 전체 주소 반환 (매장 등록용) — "서울특별시 용산구 후암동 142-57" */
  reverseGeocodeFullAddress: async (longitude: number, latitude: number): Promise<string | null> => {
    try {
      const apiKey = VWORLD_API_KEY;
      if (!apiKey) throw new Error('[vworldApi] VWORLD_API_KEY is empty');
      const res = await vworldClient.get<VworldAddressResponse>(
        '/req/address',
        {
          params: {
            service: 'address',
            request: 'getAddress',
            version: '2.0',
            crs: 'epsg:4326',
            point: `${longitude},${latitude}`,
            format: 'json',
            type: 'PARCEL',
            zipcode: 'false',
            simple: 'false',
            key: apiKey,
          },
        },
      );
      const { status, result } = res.data.response;
      if (status === 'NOT_FOUND' || !result || result.length === 0) return null;
      return result[0].text || null;
    } catch (error) {
      if (__DEV__) { console.error('[vworldApi.reverseGeocodeFullAddress] Error:', error); }
      throw error;
    }
  },
};
