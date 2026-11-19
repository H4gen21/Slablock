import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES } from '../../theme/typography';

export type ReportIconName =
  | 'hash'
  | 'trophy'
  | 'history'
  | 'info'
  | 'pin'
  | 'image'
  | 'ruler'
  | 'centering'
  | 'corners'
  | 'edges'
  | 'zoom-in'
  | 'zoom-out'
  | 'chevron-up'
  | 'chevron-down'
  | 'download'
  | 'slab'
  | 'sort-down'
  | 'sort-up';

interface ReportIconProps {
  name: ReportIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Letter drawn inside the dotted corner/edge marks ("F" or "B"). */
  letter?: string;
}

/** Outline icons used only by the grade report. Color always comes from props. */
export const ReportIcon: React.FC<ReportIconProps> = ({
  name,
  size = 24,
  color = COLORS.ink,
  strokeWidth = 2,
  letter
}) => {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none'
  };
  const letterNode = letter ? (
    <SvgText
      x="12"
      y="16.2"
      fontSize="9.5"
      fontFamily={FONT_FAMILIES.lexendBold}
      fontWeight="700"
      fill={color}
      textAnchor="middle"
    >
      {letter}
    </SvgText>
  ) : null;

  switch (name) {
    case 'hash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="2.5" width="16" height="19" rx="2.5" {...common} />
          <Line x1="10" y1="7.5" x2="9" y2="16.5" {...common} />
          <Line x1="15" y1="7.5" x2="14" y2="16.5" {...common} />
          <Line x1="7.5" y1="10" x2="16.5" y2="10" {...common} />
          <Line x1="7" y1="14" x2="16" y2="14" {...common} />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 3h10v6a5 5 0 0 1-10 0V3z" {...common} />
          <Path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" {...common} />
          <Line x1="12" y1="14" x2="12" y2="18" {...common} />
          <Path d="M8 21h8M9 18h6" {...common} />
        </Svg>
      );
    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" {...common} />
          <Polyline points="3 3 3.5 7.5 8 7" {...common} />
          <Polyline points="12 7.5 12 12 15 14" {...common} />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9.5" {...common} />
          <Line x1="12" y1="11" x2="12" y2="16.5" {...common} />
          <Circle cx="12" cy="7.6" r="1.1" fill={color} />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 22s7-7.2 7-12.5a7 7 0 1 0-14 0C5 14.8 12 22 12 22z" {...common} />
          <Circle cx="12" cy="9.5" r="2" fill={color} />
        </Svg>
      );
    case 'image':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="2.5" y="4.5" width="19" height="15" rx="1.5" {...common} />
          <Path d="M6 16l4-4.5 3 3 2-2 3 3.5" {...common} />
        </Svg>
      );
    case 'ruler':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="2" y="8" width="20" height="8" rx="1" {...common} />
          <Path d="M6 8v3M10 8v3M14 8v3M18 8v3" {...common} />
        </Svg>
      );
    case 'centering':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 5h14M7 9.5h10M5 14h14M7 18.5h10" {...common} />
        </Svg>
      );
    case 'corners':
      // Dotted square with a solid corner bracket at the top right.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 4h1M4 8v1M4 12v1M4 16v1M4 20h1M8 20h1M12 20h1M16 20h1M20 20h0.5M8 4h1" {...common} />
          <Path d="M13 4h7v7" {...common} />
          {letterNode}
        </Svg>
      );
    case 'edges':
      // Solid side rails with dotted top and bottom.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 5v14M19 5v14" {...common} />
          <Path d="M8 3h1M11.5 3h1M15 3h1M8 21h1M11.5 21h1M15 21h1" {...common} />
          {letterNode}
        </Svg>
      );
    case 'zoom-in':
    case 'zoom-out':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="10.5" cy="10.5" r="6.5" {...common} />
          <Line x1="20" y1="20" x2="15.5" y2="15.5" {...common} />
          <Line x1="7.5" y1="10.5" x2="13.5" y2="10.5" {...common} />
          {name === 'zoom-in' && <Line x1="10.5" y1="7.5" x2="10.5" y2="13.5" {...common} />}
        </Svg>
      );
    case 'chevron-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="6 15 12 9 18 15" {...common} />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="6 9 12 15 18 9" {...common} />
        </Svg>
      );
    case 'sort-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="12" y1="4" x2="12" y2="20" {...common} />
          <Polyline points="6 14 12 20 18 14" {...common} />
        </Svg>
      );
    case 'sort-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="12" y1="20" x2="12" y2="4" {...common} />
          <Polyline points="6 10 12 4 18 10" {...common} />
        </Svg>
      );
    case 'download':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3v12M7 10l5 5 5-5M4 19h16" {...common} />
        </Svg>
      );
    case 'slab':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="5" y="2" width="14" height="20" rx="2" {...common} />
          <Rect x="7.5" y="6.5" width="9" height="12.5" rx="0.5" {...common} />
        </Svg>
      );
  }
};
