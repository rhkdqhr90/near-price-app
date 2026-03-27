import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorView: React.FC<Props> = ({
  message = '오류가 발생했습니다',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} accessibilityRole="button" accessibilityLabel="다시 시도">
          <Text style={styles.buttonText}>다시 시도</Text>
        </TouchableOpacity>
      ) : null}
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
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.sm,
  },
  buttonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default ErrorView;
