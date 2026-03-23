import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  style?: ViewStyle;
}

const SkeletonBox: React.FC<Props> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const baseStyle = [
    styles.base,
    style,
    { opacity },
  ];

  return <Animated.View style={baseStyle} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray200,
    borderRadius: spacing.xs,
  },
});

export default SkeletonBox;
