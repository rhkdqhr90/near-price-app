import { apiClient } from './client';
import type { AuthTokens, KakaoLoginDto } from '../types/api.types';

export const authApi = {
  kakaoLogin: (dto: KakaoLoginDto) =>
    apiClient.post<AuthTokens>('/auth/kakao', dto),
};
