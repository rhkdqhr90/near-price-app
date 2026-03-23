import axios from 'axios';
import { KAKAO_REST_API_KEY } from '../utils/config';

// 카카오 Reverse Geocoding API 클라이언트
// 주의: 헤더를 인터셉터로 동적 설정 (모듈 로딩 시점에 Config 값이 아직 없을 수 있음)
const kakaoClient = axios.create({
  baseURL: 'https://dapi.kakao.com',
  timeout: 10000,
});

kakaoClient.interceptors.request.use((config) => {
  config.headers.Authorization = `KakaoAK ${KAKAO_REST_API_KEY}`;
  return config;
});

interface KakaoRegionInfo {
  region_type: string; // "H" (행정동) 또는 "B" (법정동)
  region_1depth_name: string; // 시/도
  region_2depth_name: string; // 구/군
  region_3depth_name: string; // 동/읍/면
}

interface KakaoCoord2RegionResponse {
  documents: KakaoRegionInfo[];
  meta: {
    total_count: number;
  };
}

/**
 * 카카오 좌표 역지오코딩: 경도/위도 → "구 동" 형식 문자열
 * - 행정동(H) 우선 사용
 * - "구 동" 형식으로 반환 (예: "강남구 역삼동")
 * - 동이 없으면 구만 반환 (예: "강남구")
 * - 구도 없으면 시도만 반환 (예: "서울특별시")
 */
export const kakaoApi = {
  reverseGeocode: async (longitude: number, latitude: number): Promise<string | null> => {
    try {
      const res = await kakaoClient.get<KakaoCoord2RegionResponse>(
        '/v2/local/geo/coord2regioncode.json',
        {
          params: {
            x: longitude, // longitude
            y: latitude, // latitude
          },
        },
      );

      const documents = res.data.documents;
      if (!documents || documents.length === 0) {
        return null;
      }

      // 행정동(H)을 우선으로 선택
      const region = documents.find((doc) => doc.region_type === 'H') || documents[0];

      const area3 = region.region_3depth_name?.trim() || ''; // 동
      const area2 = region.region_2depth_name?.trim() || ''; // 구
      const area1 = region.region_1depth_name?.trim() || ''; // 시도

      // 동이 있으면 "구 동" 형식 반환
      if (area3) {
        if (area2) {
          return `${area2} ${area3}`;
        }
        if (area1) {
          return `${area1} ${area3}`;
        }
        return area3;
      }

      // 동이 없으면 구 반환
      if (area2) {
        if (area1) {
          return `${area1} ${area2}`;
        }
        return area2;
      }

      // 구도 없으면 시도만 반환
      if (area1) {
        return area1;
      }

      return null;
    } catch (error) {
      console.error('[kakaoApi.reverseGeocode] Error:', error);
      throw error;
    }
  },
};
