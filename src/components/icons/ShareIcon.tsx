import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface Props {
  size?: number;
  color?: string;
}

const ShareIcon: React.FC<Props> = ({
  size = 24,
  color = colors.tabIconInactive,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 6l-4-4-4 4M12 2v10"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ShareIcon;
