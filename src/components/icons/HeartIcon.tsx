import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
  /** @deprecated use color/filled */
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const HeartIcon: React.FC<Props> = ({
  size = 24,
  color,
  filled,
  active = false,
  activeColor = '#222222',
  inactiveColor = '#C0C0C0',
}) => {
  const resolvedColor = color ?? (active ? activeColor : inactiveColor);
  const isFilled = filled ?? active;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={isFilled ? resolvedColor : 'none'}
        stroke={resolvedColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HeartIcon;
