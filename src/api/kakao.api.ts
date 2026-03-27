import { apiClient } from './client';

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
 * - 백엔드 /naver/kakao-reverse-geocode 프록시 경유
 * - 행정동(H) 우선 사용
 * - "구 동" 형식으로 반환 (예: "강남구 역삼동")
 * - 동이 없으면 구만 반환 (예: "강남구")
 * - 구도 없으면 시도만 반환 (예: "서울특별시")
 */
export const kakaoApi = {
  reverseGeocode: async (longitude: number, latitude: number): Promise<string | null> => {
    const res = await apiClient.get<KakaoCoord2RegionResponse>(
      '/naver/kakao-reverse-geocode',
      {
        params: { lat: latitude, lng: longitude },
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
  },
};
