import { useQuery } from '@tanstack/react-query';
import { noticeApi } from '../../api/notice.api';
import type { NoticeResponse } from '../../types/api.types';

export const noticeKeys = {
  all: ['notice'] as const,
  detail: (id: string) => ['notice', id] as const,
};

export const useNoticeList = () => {
  return useQuery<NoticeResponse[]>({
    queryKey: noticeKeys.all,
    queryFn: () => noticeApi.getAll().then((res) => res.data),
  });
};

export const useNoticeDetail = (id: string) => {
  return useQuery<NoticeResponse>({
    queryKey: noticeKeys.detail(id),
    queryFn: () => noticeApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};
