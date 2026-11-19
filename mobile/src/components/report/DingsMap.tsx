import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { GradeReport, Side } from '../../types/report';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES } from '../../theme/typography';
import { dingPoint, REGION_LABEL, SegmentedToggle } from './shared';

const SIDES = ['FRONT', 'BACK'] as const;

// Diagram geometry, in viewBox units.
const VB_W = 360;
const VB_H = 462;
const X0 = 50;
const Y0 = 44;
const W = 260;
const H = (W * 3.459) / 2.48; // ~362.6, true card proportions
const X1 = X0 + W;
const Y1 = Y0 + H;
const CX = X0 + W / 2;
const CY = Y0 + H / 2;
const BOX_W = 92;
const BOX_H = 28;

const FONT = FONT_FAMILIES.lexendMedium;

/** Dotted bracket marks at one outer corner. sx/sy = +1 or -1 (direction into the card). */
function bracket(x: number, y: number, sx: number, sy: number) {
  const o = 14; // how far the solid L sits outside the card
  const l = 32; // arm length
  const solid = `M ${x - sx * o} ${y - sy * o + sy * l} V ${y - sy * o} H ${x - sx * o + sx * l}`;
  const dotted = `M ${x + sx * 10} ${y - sy * o} V ${y + sy * 10} H ${x - sx * o}`;
  return { solid, dotted };
}

interface DingsMapProps {
  report: GradeReport;
  onDingPress: (id: string) => void;
}

/** Card-outline diagram with centering measures and numbered ding markers. */
export const DingsMap: React.FC<DingsMapProps> = ({ report, onDingPress }) => {
  const [side, setSide] = useState<Side>('FRONT');
  const [boxW, setBoxW] = useState(340);

  const c = side === 'FRONT' ? report.centering.front : report.centering.back;
  const renderW = Math.min(boxW, 420);
  const s = renderW / VB_W;

  // Inner (print) rectangle: border widths split by the centering ratios.
  const bx = W * 0.16;
  const by = H * 0.12;
  const ix0 = X0 + (bx * c.l) / 100;
  const ix1 = X1 - (bx * c.r) / 100;
  const iy0 = Y0 + (by * c.t) / 100;
  const iy1 = Y1 - (by * c.b) / 100;

  // Diagonals stop where they reach the wordmark box.
  const diag = (x: number, y: number) => {
    const dx = CX - x;
    const dy = CY - y;
    const t = Math.max(1 - (BOX_W / 2 + 8) / Math.abs(dx), 1 - (BOX_H / 2 + 8) / Math.abs(dy));
    return { x2: x + dx * t, y2: y + dy * t };
  };

  const dash = { stroke: COLORS.inkSoft, strokeWidth: 1, strokeDasharray: '6 5' };
  const label = { fill: COLORS.ink, fontFamily: FONT, fontSize: 14 };
  const sideDings = report.dings.filter((d) => d.side === side);
  const corners = [
    bracket(X0, Y0, 1, 1),
    bracket(X1, Y0, -1, 1),
    bracket(X0, Y1, 1, -1),
    bracket(X1, Y1, -1, -1)
  ];

  return (
    <View>
      <SegmentedToggle label="Map side" options={SIDES} value={side} onChange={setSide} />

      <View
        onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
        style={{ marginTop: 24, alignItems: 'center' }}
      >
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${side.toLowerCase()} centering ${c.l} left, ${c.r} right, ${c.t} top, ${c.b} bottom. ${sideDings.length} ding${sideDings.length === 1 ? '' : 's'}.`}
          style={{ width: renderW, height: VB_H * s }}
        >
          <Svg width={renderW} height={VB_H * s} viewBox={`0 0 ${VB_W} ${VB_H}`}>
            {/* Center cross, through and beyond the card */}
            <Line x1={CX} y1={Y0 - 26} x2={CX} y2={Y1 + 34} {...dash} />
            <Line x1={4} y1={CY} x2={VB_W - 4} y2={CY} {...dash} />

            {/* Outer card and inner print area */}
            <Rect x={X0} y={Y0} width={W} height={H} fill="none" stroke={COLORS.ink} strokeWidth={1.5} />
            <Rect
              x={ix0}
              y={iy0}
              width={ix1 - ix0}
              height={iy1 - iy0}
              fill="none"
              {...dash}
            />

            {/* Diagonals from the inner corners toward the center */}
            {[
              [ix0, iy0],
              [ix1, iy0],
              [ix0, iy1],
              [ix1, iy1]
            ].map(([x, y]) => (
              <Line key={`${x}_${y}`} x1={x} y1={y} {...diag(x, y)} {...dash} />
            ))}

            {/* Corner bracket marks */}
            {corners.map((b, i) => (
              <G key={i}>
                <Path d={b.solid} stroke={COLORS.ink} strokeWidth={4} fill="none" />
                <Path
                  d={b.dotted}
                  stroke={COLORS.ink}
                  strokeWidth={4}
                  strokeDasharray="4 5"
                  fill="none"
                />
              </G>
            ))}

            {/* SlabLock wordmark in the middle */}
            <Rect
              x={CX - BOX_W / 2}
              y={CY - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              fill={COLORS.ink}
            />
            <SvgText
              x={CX}
              y={CY + 5.5}
              fill={COLORS.bg}
              fontFamily={FONT_FAMILIES.lexendBold}
              fontWeight="700"
              fontSize={15}
              textAnchor="middle"
            >
              SlabLock
            </SvgText>

            {/* Top / bottom centering and width */}
            <SvgText x={CX - 7} y={iy0 - 7} textAnchor="end" {...label}>C</SvgText>
            <SvgText x={CX + 7} y={iy0 - 7} {...label}>{c.t.toFixed(2)}</SvgText>
            <SvgText x={CX - 7} y={iy1 + 18} textAnchor="end" {...label}>C</SvgText>
            <SvgText x={CX + 7} y={iy1 + 18} {...label}>{c.b.toFixed(2)}</SvgText>
            <SvgText x={CX - 7} y={Y1 + 22} textAnchor="end" {...label}>W</SvgText>
            <SvgText x={CX + 7} y={Y1 + 22} {...label}>
              {`${report.dimensionsIn.w.toFixed(3)}"`}
            </SvgText>

            {/* Left / right centering and height, rotated */}
            <G transform={`rotate(-90 ${ix0 - 6} ${CY})`}>
              <SvgText x={ix0 - 13} y={CY} textAnchor="end" {...label}>C</SvgText>
              <SvgText x={ix0 + 1} y={CY} {...label}>{c.l.toFixed(2)}</SvgText>
            </G>
            <G transform={`rotate(-90 ${ix1 + 16} ${CY})`}>
              <SvgText x={ix1 + 9} y={CY} textAnchor="end" {...label}>C</SvgText>
              <SvgText x={ix1 + 23} y={CY} {...label}>{c.r.toFixed(2)}</SvgText>
            </G>
            <G transform={`rotate(-90 ${X1 + 18} ${CY})`}>
              <SvgText x={X1 + 11} y={CY} textAnchor="end" {...label}>H</SvgText>
              <SvgText x={X1 + 25} y={CY} {...label}>
                {`${report.dimensionsIn.h.toFixed(3)}"`}
              </SvgText>
            </G>
          </Svg>

          {/* Numbered ding markers (real buttons, so they are tappable and labelled) */}
          {sideDings.map((d) => {
            const p = dingPoint(d.region, d.type);
            const size = 28;
            return (
              <TouchableOpacity
                key={d.id}
                accessibilityRole="button"
                accessibilityLabel={`Ding ${d.id.replace(/^D/, '')}: ${d.type.toLowerCase()}, ${REGION_LABEL[d.region].toLowerCase()}. Show in table.`}
                onPress={() => onDingPress(d.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  position: 'absolute',
                  left: (X0 + p.x * W) * s - size / 2,
                  top: (Y0 + p.y * H) * s - size / 2,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: COLORS.danger,
                  borderWidth: 2,
                  borderColor: COLORS.bg,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontFamily: FONT_FAMILIES.lexendBold, fontSize: 13, color: COLORS.ink }}>
                  {d.id.replace(/^D/, '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};
