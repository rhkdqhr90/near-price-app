import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size?: number;
  active?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const PlusCircleIcon: React.FC<Props> = ({
  size = 24,
  active = false,
  activeColor = colors.tabIconActive,
  inactiveColor = colors.tabIconInactive,
}) => {
  const color = active ? activeColor : inactiveColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active ? (
        <>
          <Circle cx="12" cy="12" r="10" fill={color} />
          <Path
            d="M12 8v8M8 12h8"
            stroke={colors.white}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth={1.8}
            fill="none"
          />
          <Path
            d="M12 8v8M8 12h8"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
};

export default PlusCircleIcon;
