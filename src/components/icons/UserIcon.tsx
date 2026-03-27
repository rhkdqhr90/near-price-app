import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const UserIcon: React.FC<Props> = ({
  size = 24,
  color,
  filled,
  active = false,
  activeColor = colors.gray900,
  inactiveColor = colors.gray400,
}) => {
  const resolvedColor = color ?? (active ? activeColor : inactiveColor);
  const isFilled = filled ?? active;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        fill={isFilled ? resolvedColor : 'none'}
        stroke={resolvedColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
        fill="none"
        stroke={resolvedColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default UserIcon;
