import React from 'react';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
}

const CheckIcon: React.FC<Props> = ({ size = 20, color = colors.black, filled = false }) => {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="11" fill={color} />
        <Polyline
          points="6 12 10 16 18 8"
          stroke={colors.white}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="6 12 10 16 18 8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default CheckIcon;
