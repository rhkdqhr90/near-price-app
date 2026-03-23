import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePriceRegisterStore } from '../store/priceRegisterStore';

/**
 * 가격 등록 플로우에서 작성 중인 내용이 있을 때
 * 뒤로 가기를 누르면 확인 다이얼로그를 표시합니다.
 *
 * StoreSelectScreen(첫 화면)에서만 사용하여
 * 탭 밖으로 나가는 것을 방지합니다.
 */
export function useUnsavedChangesWarning() {
  const navigation = useNavigation();
  const isDirty = usePriceRegisterStore((s) => s.isDirty);
  const reset = usePriceRegisterStore((s) => s.reset);

  useEffect(() => {
    if (!isDirty) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 작성 중인 내용이 없으면 그냥 나감
      if (!usePriceRegisterStore.getState().isDirty) return;

      e.preventDefault();

      Alert.alert(
        '작성 중인 내용이 있습니다',
        '나가시면 작성 중인 내용이 사라져요.\n정말 나가시겠습니까?',
        [
          { text: '계속 작성', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: () => {
              reset();
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, reset]);
}
