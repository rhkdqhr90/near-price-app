import { apiClient } from './client';
import type {
  UserResponse,
  UpdateNicknameDto,
  CheckNicknameResponseDto,
} from '../types/api.types';

export const userApi = {
  getCurrentUser: async () => {
    const response = await apiClient.get<UserResponse>('/user/me');
    return response.data;
  },

  updateNickname: async (userId: string, dto: UpdateNicknameDto) => {
    const response = await apiClient.patch<UserResponse>(
      `/user/${userId}/nickname`,
      dto,
    );
    return response.data;
  },

  checkNicknameAvailable: async (nickname: string) => {
    const response = await apiClient.get<CheckNicknameResponseDto>(
      `/user/check-nickname?nickname=${encodeURIComponent(nickname)}`,
    );
    return response.data;
  },

  updateFcmToken: async (userId: string, fcmToken: string) => {
    const response = await apiClient.patch<UserResponse>(
      `/user/${userId}/fcm-token`,
      { fcmToken },
    );
    return response.data;
  },
};
