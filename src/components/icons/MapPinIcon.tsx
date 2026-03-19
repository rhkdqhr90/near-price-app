import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

const MapPinIcon: React.FC<Props> = ({ size = 24, color = colors.gray700 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export default MapPinIcon;
