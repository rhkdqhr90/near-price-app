import Config from 'react-native-config';

const normalizeEnv = (value?: string): string => value?.replace(/^"|"$/g, '').trim() ?? '';

export const NAVER_MAP_CLIENT_ID = normalizeEnv(Config.NAVER_MAP_CLIENT_ID);
export const NAVER_MAPS_API_BASE = 'https://maps.apigw.ntruss.com';

const resolvedApiBaseUrl = normalizeEnv(Config.API_BASE_URL);
if (!resolvedApiBaseUrl) {
  throw new Error('API_BASE_URL is missing for this build variant.');
}
export const API_BASE_URL = resolvedApiBaseUrl;

// package.json의 version을 단일 소스로 사용 (gradle versionName과 동기화 필요)
export const APP_VERSION: string = require('../../package.json').version;
