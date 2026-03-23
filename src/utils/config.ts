import Config from 'react-native-config';

export const NAVER_MAP_CLIENT_ID = Config.NAVER_MAP_CLIENT_ID ?? '';
export const NAVER_MAP_CLIENT_SECRET = Config.NAVER_MAP_CLIENT_SECRET ?? '';
export const NAVER_MAPS_API_BASE = 'https://maps.apigw.ntruss.com';

// Naver Search API (openapi.naver.com) — 장소 검색 (naver-local.api.ts 용)
export const NAVER_SEARCH_CLIENT_ID = Config.NAVER_SEARCH_CLIENT_ID ?? '';
export const NAVER_SEARCH_CLIENT_SECRET = Config.NAVER_SEARCH_CLIENT_SECRET ?? '';

// Kakao REST API Key — 역지오코딩 전용 (kakao.api.ts 용)
export const KAKAO_REST_API_KEY = Config.KAKAO_REST_API_KEY ?? '';

// Vworld Geocoder API Key — 역지오코딩 폴백 (vworld.api.ts 용)
export const VWORLD_API_KEY = Config.VWORLD_API_KEY ?? '';

// 백엔드 Base URL — .env의 API_BASE_URL
// 에뮬레이터: http://10.0.2.2:3000 / 실기기: http://<LAN_IP>:3000
export const API_BASE_URL =
  Config.API_BASE_URL ??
  (__DEV__ ? 'http://10.0.2.2:3000' : 'https://api.nearprice.kr');

export const APP_VERSION = '0.0.1';
