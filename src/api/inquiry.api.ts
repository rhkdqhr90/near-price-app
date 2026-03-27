import { apiClient } from './client';
import type { CreateInquiryDto, InquiryResponse } from '../types/api.types';

export const inquiryApi = {
  createInquiry: (dto: CreateInquiryDto) =>
    apiClient.post<InquiryResponse>('/inquiry', dto),

  getMyInquiries: () =>
    apiClient.get<InquiryResponse[]>('/inquiry/my'),
};
