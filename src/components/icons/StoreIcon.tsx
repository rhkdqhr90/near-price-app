import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
}

const StoreIcon: React.FC<Props> = ({ size = 22, color = '#222222', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? color : 'none'}
    />
    <Rect
      x="9"
      y="22"
      width="6"
      height="8"
      rx="1"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0 -8)"
      fill={filled ? color : 'none'}
    />
  </Svg>
);

export default StoreIcon;
