import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import { API_BASE_URL } from '../utils/config';
import { queryClient } from '../lib/queryClient';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export { isAxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token !== null) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // 요청 성공 → 오프라인 상태 해제
    useNetworkStore.getState().setOffline(false);
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    // 네트워크 에러 감지 (서버 응답 없음 = 네트워크 문제)
    if (!error.response && error.code !== 'ERR_CANCELED') {
      useNetworkStore.getState().setOffline(true);
    }

    const config = error.config as RetryConfig;

    if (error.response?.status === 401 && !config._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          config._retry = true;
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient(config);
        });
      }

      config._retry = true;
      isRefreshing = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
        setTokens(newAccess, newRefresh);
        processQueue(null, newAccess);
        // 토큰 갱신 성공 후 UI가 stale 데이터를 유지하지 않도록 전체 캐시 무효화
        void queryClient.invalidateQueries({});
        isRefreshing = false;
        config.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(config);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);
