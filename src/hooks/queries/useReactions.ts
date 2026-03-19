import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionApi } from '../../api/reaction.api';
import type { ReactionResponse } from '../../types/api.types';

export const reactionKeys = {
  detail: (priceId: string) => ['reactions', priceId] as const,
};

export const useReactions = (priceId: string) =>
  useQuery<ReactionResponse>({
    queryKey: reactionKeys.detail(priceId),
    queryFn: () => reactionApi.getReactions(priceId).then((res) => res.data),
    enabled: !!priceId,
  });

export const useConfirmReaction = (priceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reactionApi.confirm(priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reactionKeys.detail(priceId) });
    },
  });
};

export const useReportReaction = (priceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => reactionApi.report(priceId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reactionKeys.detail(priceId) });
    },
  });
};
