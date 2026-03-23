import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { MyPageScreenProps } from '../../navigation/types';
import EmptyState from '../../components/common/EmptyState';
import HeartIcon from '../../components/icons/HeartIcon';
import { colors } from '../../theme/colors';

type Props = MyPageScreenProps<'LikedPrices'>;

const LikedPricesScreen: React.FC<Props> = () => (
  <View style={styles.container}>
    <EmptyState
      icon={HeartIcon}
      title="좋아요한 가격이 없어요"
      subtitle="마음에 드는 가격에 좋아요를 눌러 보세요"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default LikedPricesScreen;
