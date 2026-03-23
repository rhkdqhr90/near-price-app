import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  message?: string;
}

const LoadingView: React.FC<Props> = ({ message }) => {
  return (
    <View style={styles.container} accessible={true} accessibilityLabel={message || '로딩 중'}>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="로딩" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
    marginTop: spacing.lg,
  },
});

export default LoadingView;
