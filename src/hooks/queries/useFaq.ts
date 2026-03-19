import { useQuery } from '@tanstack/react-query';
import { faqApi } from '../../api/faq.api';
import type { FaqGroupResponse } from '../../types/api.types';

export const faqKeys = {
  all: ['faq'] as const,
};

export const useFaqList = () => {
  return useQuery<FaqGroupResponse[]>({
    queryKey: faqKeys.all,
    queryFn: () => faqApi.getAll().then((res) => res.data),
  });
};
