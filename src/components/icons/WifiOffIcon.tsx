import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

const WifiOffIcon: React.FC<Props> = ({ size = 24, color = '#222222' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 6C1 6 5 2 12 2C19 2 23 6 23 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 10C5 10 7.5 8 12 8C16.5 8 19 10 19 10"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 13.5C8.5 13.5 9.8 12.5 12 12.5C14.2 12.5 15.5 13.5 15.5 13.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18H12.01"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="2"
      y1="2"
      x2="22"
      y2="22"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default WifiOffIcon;
