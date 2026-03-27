import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../theme';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
  accessibilityLabel?: string;
}

const FlyerIcon: React.FC<Props> = ({
  size = 24,
  color = colors.tabIconInactive,
  filled = false,
  accessibilityLabel = '전단지',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityLabel={accessibilityLabel} accessible>
    {filled ? (
      <>
        <Rect x="3" y="2" width="15" height="20" rx="2" fill={color} />
        <Path d="M6 7h9" stroke={colors.white} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6 11h9" stroke={colors.white} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6 15h5" stroke={colors.white} strokeWidth={1.8} strokeLinecap="round" />
      </>
    ) : (
      <>
        <Rect
          x="3"
          y="2"
          width="15"
          height="20"
          rx="2"
          stroke={color}
          strokeWidth={1.8}
          fill="none"
        />
        <Path d="M6 7h9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6 11h9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6 15h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </>
    )}
  </Svg>
);

export default FlyerIcon;
