# API 패턴

## Axios 인스턴스

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000'   // Android 에뮬레이터
  : 'https://api.nearprice.kr';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: JWT 토큰 자동 주입
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 refresh → 재시도, 실패 시 로그아웃
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
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
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

## API 호출 함수

각 도메인별로 api/ 파일을 분리한다. 반환값은 AxiosResponse.

```typescript
// api/price.api.ts
import { apiClient } from './client';
import { PriceResponse, CreatePriceDto } from '../types/api.types';

export const priceApi = {
  getByProduct: (productId: string) =>
    apiClient.get<PriceResponse[]>(`/price/product/${productId}`),

  create: (dto: CreatePriceDto) =>
    apiClient.post<PriceResponse>('/price', dto),

  getAll: () =>
    apiClient.get<PriceResponse[]>('/price'),

  remove: (id: string) =>
    apiClient.delete(`/price/${id}`),
};
```

```typescript
// api/product.api.ts
import { apiClient } from './client';
import { ProductResponse } from '../types/api.types';

export const productApi = {
  getAll: (search?: string) =>
    apiClient.get<ProductResponse[]>('/product', { params: search ? { search } : undefined }),

  getOne: (id: string) =>
    apiClient.get<ProductResponse>(`/product/${id}`),
};
```

```typescript
// api/wishlist.api.ts
import { apiClient } from './client';
import { WishlistResponse } from '../types/api.types';

export const wishlistApi = {
  getMyList: () =>
    apiClient.get<WishlistResponse>('/wishlists/me'),

  add: (productId: string) =>
    apiClient.post('/wishlists', { productId }),

  remove: (productId: string) =>
    apiClient.delete(`/wishlists/${productId}`),
};
```

## React Query 훅

queryFn에서 반드시 `.then(res => res.data)`로 AxiosResponse를 벗긴다.
mutationFn도 동일.

```typescript
// hooks/queries/usePrices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceApi } from '../../api/price.api';
import { CreatePriceDto } from '../../types/api.types';

// 쿼리 키 상수 — 하드코딩 금지
export const priceKeys = {
  all: ['prices'] as const,
  byProduct: (productId: string) => ['prices', 'product', productId] as const,
};

// 조회 훅
export const useProductPrices = (productId: string) => {
  return useQuery({
    queryKey: priceKeys.byProduct(productId),
    queryFn: () => priceApi.getByProduct(productId).then((res) => res.data),
    enabled: !!productId,
  });
};

// 생성 훅
export const useCreatePrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePriceDto) =>
      priceApi.create(dto).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceKeys.all });
    },
  });
};
```

```typescript
// hooks/queries/useWishlist.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../api/wishlist.api';

export const wishlistKeys = {
  mine: ['wishlists', 'me'] as const,
};

export const useMyWishlist = () => {
  return useQuery({
    queryKey: wishlistKeys.mine,
    queryFn: () => wishlistApi.getMyList().then((res) => res.data),
  });
};

export const useAddWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      wishlistApi.add(productId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
    },
  });
};
```

## 쿼리 키 규칙
- 도메인별 keys 객체 정의 (priceKeys, wishlistKeys 등)
- 리스트: `['도메인']`
- 상세: `['도메인', id]`
- 필터: `['도메인', '필터명', 값]`
- 문자열 하드코딩 금지 → keys 객체 사용

## 금지사항
- 컴포넌트에서 직접 axios/apiClient 호출 금지
- queryFn/mutationFn에서 `.then(res => res.data)` 빠뜨리기 금지
- 쿼리 키 문자열 하드코딩 금지
