import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/tokens';
import { FONT_FAMILIES } from '../theme/typography';

interface RingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  labelColor?: string;
  labelSize?: number;
}

export const Ring: React.FC<RingProps> = ({
  progress,
  size = 48,
  strokeWidth = 4.5,
  color = COLORS.yellowDeep,
  trackColor = COLORS.yellowSoft,
  label,
  labelColor = COLORS.ink,
  labelSize = 13
}) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {label !== undefined && (
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text
            style={{
              color: labelColor,
              fontSize: labelSize,
              fontFamily: FONT_FAMILIES.lexendBold
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </View>
  );
};
