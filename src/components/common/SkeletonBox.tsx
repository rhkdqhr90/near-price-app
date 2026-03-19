import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  style?: ViewStyle;
}

const SkeletonBox: React.FC<Props> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray200,
    borderRadius: 4,
  },
});

export default SkeletonBox;
