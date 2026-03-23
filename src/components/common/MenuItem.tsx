import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface MenuItemProps {
  icon: React.ReactElement;
  label: string;
  rightLabel?: string;
  onPress: () => void;
  isLast?: boolean;
  isDanger?: boolean;
}

const MenuItem = React.memo<MenuItemProps>(({
  icon,
  label,
  rightLabel,
  onPress,
  isLast = false,
  isDanger = false,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {icon}
    <Text style={[styles.menuLabel, isDanger && styles.menuLabelDanger]}>
      {label}
    </Text>
    {rightLabel ? (
      <Text style={styles.menuRightLabel} numberOfLines={1}>{rightLabel}</Text>
    ) : null}
    <ChevronRightIcon size={16} color={colors.gray400} />
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.inputPad,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
    minHeight: 52,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    ...typography.headingMd,
    flex: 1,
  },
  menuLabelDanger: {
    color: colors.danger,
  },
  menuRightLabel: {
    ...typography.bodySm,
    maxWidth: 120,
  },
});

export default MenuItem;
