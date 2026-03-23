import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ActionProps {
  label: string;
  onPress: () => void;
}

interface Props {
  /** SVG icon component that accepts size and color */
  icon?: React.FC<{ size?: number; color?: string }>;
  iconSize?: number;
  title: string;
  subtitle?: string;
  action?: ActionProps;
}

const EmptyState: React.FC<Props> = ({
  icon: Icon,
  iconSize = 52,
  title,
  subtitle,
  action,
}) => (
  <View style={styles.container}>
    {Icon ? (
      <View style={styles.iconWrapper}>
        <Icon size={iconSize} color={colors.gray400} />
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {action ? (
      <TouchableOpacity style={styles.button} onPress={action.onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={action.label}>
        <Text style={styles.buttonText}>{action.label}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl * 2,
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headingMd,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySm,
    textAlign: 'center',
    lineHeight: spacing.xl,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg + spacing.lg,
  },
  buttonText: {
    ...typography.headingMd,
    color: colors.white,
  },
});

export default EmptyState;
