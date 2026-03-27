import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
  ) : (
    <Text style={[styles.text, styles[`text_${size}`], styles[`text_${variant}`]]}>{label}</Text>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.touchable, fullWidth && styles.fullWidth, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={isDisabled ? [colors.gray400, colors.gray400] : [colors.primary, colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles[size]]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={label}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: spacing.radiusButton,
    overflow: 'hidden',
  },
  base: {
    borderRadius: spacing.radiusButton,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 32,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 44,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    minHeight: 52,
  },
  // Variants
  primary: {},
  secondary: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: spacing.borderEmphasis,
    borderColor: colors.outlineVariant,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Disabled state (non-primary)
  disabled: {
    opacity: spacing.disabledOpacity,
  },
  // Full width
  fullWidth: {
    width: '100%',
  },
  // Text styles
  text: {},
  text_primary: {
    color: colors.onPrimary,
  },
  text_secondary: {
    color: colors.onBackground,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_sm: {
    ...typography.bodySm,
  },
  text_md: {
    ...typography.headingMd,
  },
  text_lg: {
    ...typography.headingLg,
  },
});

export default Button;
