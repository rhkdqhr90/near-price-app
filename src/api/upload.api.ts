import { apiClient } from './client';
import type { UploadResponse } from '../types/api.types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface RNFileBlob {
  uri: string;
  name: string;
  type: string;
}

export const uploadApi = {
  uploadImage: (uri: string, filename: string, mimeType: string, fileSize?: number) => {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return Promise.reject(new Error(`지원하지 않는 파일 형식입니다. (허용: jpg, png, webp)`));
    }
    if (fileSize !== undefined && fileSize > MAX_FILE_SIZE_BYTES) {
      return Promise.reject(new Error(`파일 크기가 너무 큽니다. (최대 10 MB)`));
    }

    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as unknown as RNFileBlob);

    return apiClient.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
