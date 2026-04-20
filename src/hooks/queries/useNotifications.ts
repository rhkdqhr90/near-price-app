import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import { useAuthStore } from '../../store/authStore';
import type { NotificationListResponse } from '../../types/api.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/**
 * 알림 목록 (무한 스크롤, cursor 기반).
 */
export const useNotificationList = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return useInfiniteQuery<NotificationListResponse>({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) =>
      notificationApi
        .list({ cursor: pageParam as string | undefined, limit: 20 })
        .then((res) => res.data),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: isAuthenticated,
    // 알림 목록은 실시간성 중요 — 화면 진입 시 매번 최신화
    staleTime: 0,
  });
};

/**
 * 미읽음 알림 개수 (벨 아이콘 뱃지 표시용).
 * 로그인 상태일 때만 실행 — 60초마다 자동 갱신, 백그라운드에서는 중단.
 * 배터리/데이터 과부하 방지 + FCM 수신 시 별도 invalidate로 즉시성 보장 가능.
 */
export const useUnreadNotificationCount = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return useQuery<{ count: number }>({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationApi.getUnreadCount().then((res) => res.data),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
