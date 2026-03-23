import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
}

const HomeIcon: React.FC<Props> = ({
  size = 24,
  color = colors.tabIconInactive,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <Path
          d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
          fill={color}
        />
        <Path
          d="M9 22V14h6v8"
          stroke={colors.white}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <Path
          d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M9 22V14h6v8"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </Svg>
);

export default HomeIcon;
