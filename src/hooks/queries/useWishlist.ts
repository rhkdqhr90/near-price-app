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
  const showToast = useToastStore(s => s.showToast);
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
      showToast('찜 목록에 추가됐어요.', 'success');
    },
    onError: () => {
      showToast('찜 추가에 실패했어요. 다시 시도해 주세요.', 'error');
    },
  });
};

export const useRemoveWishlist = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore(s => s.showToast);
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
      showToast('찜 목록에서 삭제됐어요.', 'success');
    },
    onError: () => {
      showToast('삭제에 실패했어요. 다시 시도해 주세요.', 'error');
    },
  });
};
