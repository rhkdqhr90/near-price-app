import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface WonIconProps {
  size?: number;
  color?: string;
}

const WonIcon: React.FC<WonIconProps> = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 4l4.5 14L12 8l4.5 10L21 4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 10h20M2 15h20"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default WonIcon;
