import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

const MoreIcon: React.FC<Props> = ({ size = 20, color = colors.black }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);

export default MoreIcon;
