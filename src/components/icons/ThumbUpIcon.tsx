import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
}

const ThumbUpIcon: React.FC<Props> = ({ size = 20, color = '#222222', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {filled ? (
      <Path
        d="M2 20h2V9H2v11zm20-9a2 2 0 00-2-2h-6.32l.95-4.57.03-.32a1.49 1.49 0 00-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 002 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
        fill={color}
      />
    ) : (
      <Path
        d="M2 20h2V9H2v11zm20-9a2 2 0 00-2-2h-6.32l.95-4.57.03-.32a1.49 1.49 0 00-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 002 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2zM9 19V9l4.34-4.34L12 9h8v2l-3 7H9z"
        fill={color}
      />
    )}
  </Svg>
);

export default ThumbUpIcon;
