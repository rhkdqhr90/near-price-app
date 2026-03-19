import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

const HelpCircleIcon: React.FC<Props> = ({ size = 24, color = colors.gray700 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17h.01"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default HelpCircleIcon;
