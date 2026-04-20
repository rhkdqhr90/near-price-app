import { apiClient } from './client';
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/api.types';

export const notificationApi = {
  list: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<NotificationListResponse>('/notifications', { params }),

  getUnreadCount: () =>
    apiClient.get<UnreadCountResponse>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.patch<void>(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch<void>('/notifications/read-all'),

  remove: (id: string) => apiClient.delete<void>(`/notifications/${id}`),
};
