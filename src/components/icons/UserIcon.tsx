import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const UserIcon: React.FC<Props> = ({
  size = 24,
  active = false,
  activeColor = '#222222',
  inactiveColor = '#C0C0C0',
}) => {
  const color = active ? activeColor : inactiveColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        fill={active ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default UserIcon;
