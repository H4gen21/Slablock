import React from 'react';
import { Text, View } from 'react-native';
import type { Ding, GradeReport, Side } from '../../types/report';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { ReportIcon, type ReportIconName } from './ReportIcon';
import { FadeIn, TILE } from './shared';

type Tone = 'neutral' | 'clean' | 'dings';

const SummaryTile: React.FC<{
  icon: ReportIconName;
  title: string;
  lines: Array<[string, string]>;
  tone: Tone;
}> = ({ icon, title, lines, tone }) => {
  const iconColor = tone === 'dings' ? COLORS.yellow : tone === 'clean' ? COLORS.muted : COLORS.ink;
  const valueColor = tone === 'dings' ? COLORS.yellow : tone === 'clean' ? COLORS.inkSoft : COLORS.ink;
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${lines.map(([l, v]) => `${l} ${v}`).join(', ')}`}
      style={[
        TILE,
        {
          paddingVertical: 22,
          paddingHorizontal: 10,
          flex: 1,
          borderColor: tone === 'dings' ? COLORS.yellowBorder : COLORS.line
        }
      ]}
    >
      <ReportIcon name={icon} size={38} color={iconColor} strokeWidth={2} />
      <Text
        style={[
          TYPE.sectionHeading,
          {
            color: tone === 'clean' ? COLORS.inkSoft : COLORS.ink,
            fontSize: 18,
            letterSpacing: 1.5,
            marginTop: 10,
            marginBottom: 4
          }
        ]}
      >
        {title}
      </Text>
      {lines.map(([label, value]) => (
        <Text key={label} style={{ lineHeight: 24 }}>
          <Text style={[TYPE.body, { color: COLORS.muted }]}>{label}: </Text>
          <Text
            style={{
              fontFamily: FONT_FAMILIES.lexendBold,
              fontSize: 16,
              letterSpacing: 0.6,
              color: valueColor
            }}
          >
            {value}
          </Text>
        </Text>
      ))}
    </View>
  );
};

function count(dings: Ding[], type: Ding['type'], side: Side) {
  return dings.filter((d) => d.type === type && d.side === side).length;
}

function dingTile(dings: Ding[], type: Ding['type']) {
  const f = count(dings, type, 'FRONT');
  const b = count(dings, type, 'BACK');
  const label = (n: number) => `${n} DING${n === 1 ? '' : 'S'}`;
  return {
    lines: [
      ['F', label(f)],
      ['B', label(b)]
    ] as Array<[string, string]>,
    tone: (f + b > 0 ? 'dings' : 'clean') as Tone
  };
}

/** Centering tile, then a 2 x 2 grid of corners / edges / surface / dimensions. */
export const SummaryTiles: React.FC<{ report: GradeReport }> = ({ report }) => {
  const { front, back } = report.centering;
  const fmt = (c: typeof front) => `${c.l}L/${c.r}R ${c.t}T/${c.b}B`;
  const corners = dingTile(report.dings, 'CORNER');
  const edges = dingTile(report.dings, 'EDGE');
  const surface = dingTile(report.dings, 'SURFACE');

  return (
    <View style={{ gap: 14, marginTop: 36 }}>
      <FadeIn>
        <SummaryTile
          icon="centering"
          title="Centering"
          tone="neutral"
          lines={[
            ['F', fmt(front)],
            ['B', fmt(back)]
          ]}
        />
      </FadeIn>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <FadeIn style={{ flex: 1 }}>
          <SummaryTile icon="corners" title="Corners" {...corners} />
        </FadeIn>
        <FadeIn style={{ flex: 1 }}>
          <SummaryTile icon="edges" title="Edges" {...edges} />
        </FadeIn>
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <FadeIn style={{ flex: 1 }}>
          <SummaryTile icon="image" title="Surface" {...surface} />
        </FadeIn>
        <FadeIn style={{ flex: 1 }}>
          <SummaryTile
            icon="ruler"
            title="Dimensions"
            tone="neutral"
            lines={[
              ['H', `${report.dimensionsIn.h.toFixed(3)}"`],
              ['W', `${report.dimensionsIn.w.toFixed(3)}"`]
            ]}
          />
        </FadeIn>
      </View>
    </View>
  );
};
