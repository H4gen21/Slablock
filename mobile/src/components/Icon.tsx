import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { COLORS } from '../theme/tokens';

export type IconName =
  | 'nfc'
  | 'shield'
  | 'check'
  | 'alert'
  | 'bell'
  | 'copy'
  | 'back'
  | 'chevron-right'
  | 'home'
  | 'collection'
  | 'activity'
  | 'profile'
  | 'logout'
  | 'chip'
  | 'chain'
  | 'close'
  | 'loupe';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = COLORS.ink,
  strokeWidth = 2
}) => {
  switch (name) {
    case 'nfc':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 8.5a6.5 6.5 0 0 1 0 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M9.5 6a10 10 0 0 1 0 12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M13 3.5a13.5 13.5 0 0 1 0 17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="3.5" cy="12" r="1.5" fill={color} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="m9 12 2 2 4-4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="20 6 9 17 4 12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m10.29 3.86-8.47 14.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="12"
            y1="9"
            x2="12"
            y2="13"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="17" r="1" fill={color} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'copy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            ry="2"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="15 18 9 12 15 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="9 18 15 12 9 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="9 22 9 12 15 12 15 22"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'collection':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'activity':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="22 12 18 12 15 21 9 3 6 12 2 12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="16 17 21 12 16 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="21"
            y1="12"
            x2="9"
            y2="12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'chip':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="5"
            y="5"
            width="14"
            height="14"
            rx="2"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="9"
            y="9"
            width="6"
            height="6"
            rx="1"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Line x1="9" y1="2" x2="9" y2="5" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="15" y1="2" x2="15" y2="5" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="9" y1="19" x2="9" y2="22" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="15" y1="19" x2="15" y2="22" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'chain':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'loupe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
          <Line
            x1="20"
            y1="20"
            x2="16"
            y2="16"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'close':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
};
