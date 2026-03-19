import { useMutation } from '@tanstack/react-query';
import type { StoreResponse, PriceSubmitData, CreatePriceDto } from '../../types/api.types';
import { priceApi } from '../../api/price.api';
import { uploadApi } from '../../api/upload.api';

export const useSubmitPrice = (
  priceData: PriceSubmitData,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void },
) => {
  return useMutation({
    mutationFn: async (store: StoreResponse) => {
      if (!priceData.imageUri) {
        throw new Error('이미지를 선택해 주세요.');
      }

      const uploadResult = await uploadApi.uploadImage(
        priceData.imageUri,
        'price.jpg',
        'image/jpeg',
      );

      const imageUrl = uploadResult.data.url;
      if (!imageUrl) {
        throw new Error('이미지 업로드 결과가 올바르지 않습니다.');
      }

      const createPriceDto: CreatePriceDto = {
        storeId: store.id,
        productId: priceData.productId,
        price: priceData.price,
        imageUrl,
        quantity: priceData.quantity,
        condition: priceData.condition,
      };

      return priceApi.create(createPriceDto);
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
