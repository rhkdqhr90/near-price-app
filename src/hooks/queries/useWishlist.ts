import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../api/wishlist.api';
import type { WishlistResponse } from '../../types/api.types';
import { useToastStore } from '../../store/toastStore';

export const wishlistKeys = {
  mine: ['wishlists', 'me'] as const,
};

export const useMyWishlist = () => {
  return useQuery<WishlistResponse>({
    queryKey: wishlistKeys.mine,
    queryFn: () => wishlistApi.getMyList().then(res => res.data),
  });
};

export const useAddWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
    },
  });
};

export const useRemoveWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
      // 컴포넌트 언마운트 여부와 무관하게 실행되도록 훅 레벨에서 toast 처리
      useToastStore.getState().showToast('찜 목록에서 삭제했어요', 'info');
    },
    onError: () => {
      useToastStore.getState().showToast('삭제에 실패했어요', 'error');
    },
  });
};
