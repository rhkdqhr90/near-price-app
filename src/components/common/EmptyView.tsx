import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  message?: string;
}

const EmptyView: React.FC<Props> = ({ message = '데이터가 없습니다' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.xl,
  },
  message: {
    ...typography.bodyMd,
    color: colors.gray600,
    textAlign: 'center',
  },
});

export default EmptyView;
