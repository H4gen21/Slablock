import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText, TSpan } from 'react-native-svg';
import type { SlabItem, SubGradeKey } from '../data/demo';
import { COLORS } from '../theme/tokens';
import { FONT_FAMILIES } from '../theme/typography';

interface GradingGridProps {
  subGrades: SlabItem['subGrades'];
}

// Layout in a 320 x 280 viewBox. The card is 130 x 182 (63:88) split into
// 5 x 7 equal 26 px cells.
const VB_W = 320;
const VB_H = 280;
const CW = 130;
const CH = 182;
const CX = (VB_W - CW) / 2;
const CY = (VB_H - CH) / 2;
const CELL = 26;
const EDGE = 8;

interface Leader {
  key: SubGradeKey;
  label: string;
  points: string;
  dot: [number, number];
  text: [number, number];
  anchor: 'start' | 'end';
}

const LEADERS: Leader[] = [
  {
    key: 'corners',
    label: 'Corners',
    dot: [CX + CW - 9, CY + 9],
    points: `${CX + CW - 9},${CY + 9} ${CX + CW + 26},${CY - 22} ${VB_W - 4},${CY - 22}`,
    text: [VB_W - 4, CY - 28],
    anchor: 'end'
  },
  {
    key: 'edges',
    label: 'Edges',
    dot: [CX + 4, CY + CH / 2],
    points: `${CX + 4},${CY + CH / 2} 4,${CY + CH / 2}`,
    text: [4, CY + CH / 2 - 6],
    anchor: 'start'
  },
  {
    key: 'centering',
    label: 'Centering',
    dot: [CX + CW - 13, CY + CH - 50],
    points: `${CX + CW - 13},${CY + CH - 50} ${CX + CW + 26},${CY + CH - 20} ${VB_W - 4},${CY + CH - 20}`,
    text: [VB_W - 4, CY + CH - 26],
    anchor: 'end'
  },
  {
    key: 'surface',
    label: 'Surface',
    dot: [CX + CW / 2 - 10, CY + CH / 2 + 30],
    points: `${CX + CW / 2 - 10},${CY + CH / 2 + 30} ${CX - 24},${CY + CH + 22} 4,${CY + CH + 22}`,
    text: [4, CY + CH + 16],
    anchor: 'start'
  }
];

/**
 * Empty card-shaped grading grid with leader lines to the four inspection
 * regions. A region is highlighted in deep yellow only when its sub-grade is
 * below 10.0. No artwork or card text is drawn.
 */
export const GradingGrid: React.FC<GradingGridProps> = ({ subGrades }) => {
  const flagged = (k: SubGradeKey) => subGrades[k] < 10;
  const hl = COLORS.yellowDeep;
  const hlFill = 'rgba(224, 168, 0, 0.26)';

  const gridLines: React.ReactNode[] = [];
  for (let c = 1; c < CW / CELL; c += 1) {
    gridLines.push(
      <Line
        key={`v${c}`}
        x1={CX + c * CELL}
        y1={CY}
        x2={CX + c * CELL}
        y2={CY + CH}
        stroke={COLORS.line}
        strokeWidth={0.8}
      />
    );
  }
  for (let r = 1; r < CH / CELL; r += 1) {
    gridLines.push(
      <Line
        key={`h${r}`}
        x1={CX}
        y1={CY + r * CELL}
        x2={CX + CW}
        y2={CY + r * CELL}
        stroke={COLORS.line}
        strokeWidth={0.8}
      />
    );
  }

  const corners: Array<[number, number]> = [
    [CX, CY],
    [CX + CW - CELL, CY],
    [CX, CY + CH - CELL],
    [CX + CW - CELL, CY + CH - CELL]
  ];

  // Side strips between the corner cells.
  const edgeStrips = [
    `M${CX + CELL},${CY} h${CW - 2 * CELL} v${EDGE} h${-(CW - 2 * CELL)} Z`,
    `M${CX + CELL},${CY + CH - EDGE} h${CW - 2 * CELL} v${EDGE} h${-(CW - 2 * CELL)} Z`,
    `M${CX},${CY + CELL} h${EDGE} v${CH - 2 * CELL} h${-EDGE} Z`,
    `M${CX + CW - EDGE},${CY + CELL} h${EDGE} v${CH - 2 * CELL} h${-EDGE} Z`
  ];

  return (
    <View
      accessible
      accessibilityLabel={`Grading grid. ${LEADERS.map((l) => `${l.label} ${subGrades[l.key].toFixed(1)}`).join(', ')}`}
      style={{ width: '100%', maxWidth: 380, alignSelf: 'center', aspectRatio: VB_W / VB_H }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {/* Card outline and equal-cell grid */}
        <Rect
          x={CX}
          y={CY}
          width={CW}
          height={CH}
          rx={8}
          fill={COLORS.bgElevated}
        />
        {gridLines}

        {/* Surface: interior cells */}
        {flagged('surface') && (
          <Rect
            x={CX + CELL}
            y={CY + CELL}
            width={CW - 2 * CELL}
            height={CH - 2 * CELL}
            fill={hlFill}
            stroke={hl}
            strokeWidth={1.2}
          />
        )}

        {/* Centering: inner frame where the print border sits */}
        <Rect
          x={CX + 13}
          y={CY + 13}
          width={CW - 26}
          height={CH - 26}
          fill="none"
          stroke={flagged('centering') ? hl : COLORS.inkMuted}
          strokeWidth={flagged('centering') ? 1.6 : 1}
          strokeDasharray="4 3"
        />

        {/* Edges: side strips */}
        {flagged('edges') &&
          edgeStrips.map((d) => (
            <Path key={d} d={d} fill={hlFill} stroke={hl} strokeWidth={1} />
          ))}

        {/* Corners: corner cells */}
        {flagged('corners') &&
          corners.map(([x, y]) => (
            <Rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={hlFill}
              stroke={hl}
              strokeWidth={1}
            />
          ))}

        <Rect
          x={CX}
          y={CY}
          width={CW}
          height={CH}
          rx={8}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={1.6}
        />

        {/* Leader lines and labels */}
        {LEADERS.map((l) => {
          const bad = flagged(l.key);
          const color = bad ? hl : COLORS.inkSecondary;
          return (
            <G key={l.key}>
              <Path
                d={`M${l.points.split(' ').join(' L')}`}
                fill="none"
                stroke={color}
                strokeWidth={1.2}
              />
              <Circle
                cx={l.dot[0]}
                cy={l.dot[1]}
                r={3.2}
                fill={bad ? hl : COLORS.bgElevated}
                stroke={color}
                strokeWidth={1.2}
              />
              <SvgText
                x={l.text[0]}
                y={l.text[1]}
                textAnchor={l.anchor}
                fontFamily={FONT_FAMILIES.lexendSemiBold}
                fontSize={11.5}
                fill={COLORS.ink}
              >
                {`${l.label} `}
                <TSpan fill={bad ? hl : COLORS.inkMuted}>
                  {subGrades[l.key].toFixed(1)}
                </TSpan>
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};
