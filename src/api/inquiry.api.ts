import { apiClient } from './client';

export interface CreateInquiryDto {
  title: string;
  content: string;
  email: string;
}

export interface InquiryResponse {
  id: string;
  title: string;
  content: string;
  email: string;
  status: 'pending' | 'answered' | 'closed';
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export const inquiryApi = {
  createInquiry: (dto: CreateInquiryDto) =>
    apiClient.post<InquiryResponse>('/inquiry', dto),

  getMyInquiries: () =>
    apiClient.get<InquiryResponse[]>('/inquiry/my'),
};
