import { apiClient } from './client';
import type { UploadResponse } from '../types/api.types';

export const uploadApi = {
  uploadImage: (uri: string, filename: string, mimeType: string) => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

    return apiClient.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
