import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { CornerScore, EdgeScore, Side } from '../../types/report';
import { COLORS } from '../../theme/tokens';
import { TYPE } from '../../theme/typography';
import { ReportIcon } from './ReportIcon';
import {
  BlockHeading,
  CardCrop,
  Checkbox,
  EmptyLine,
  FadeIn,
  FRAME,
  MetricRows,
  REGION_LABEL
} from './shared';

type Score = CornerScore | EdgeScore;

const SIDES: Side[] = ['FRONT', 'BACK'];

/** A region is null (not drawn) when every metric is a perfect 1000. */
export function isImperfect(s: Score): boolean {
  return s.fray < 1000 || s.fill < 1000 || ('angle' in s && (s.angle ?? 1000) < 1000);
}

function metricRows(s: Score): Array<[string, number]> {
  const rows: Array<[string, number]> = [
    ['Fray', s.fray],
    ['Fill', s.fill]
  ];
  if ('angle' in s && s.angle !== undefined) rows.push(['Angle', s.angle]);
  return rows;
}

interface CropTileProps {
  slabKey: string;
  grade: number;
  score: Score;
  w: number;
  h: number;
  cardWidth: number;
  annotate: boolean;
}

const CropTile: React.FC<CropTileProps> = ({ slabKey, grade, score, w, h, cardWidth, annotate }) => (
  <FadeIn style={{ alignItems: 'center' }}>
    <View
      style={[FRAME, { padding: 7 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${score.side.toLowerCase()} ${REGION_LABEL[score.region].toLowerCase()} close-up`}
    >
      <CardCrop
        id={`crop_${slabKey}_${score.side}_${score.region}`}
        side={score.side}
        region={score.region}
        grade={grade}
        w={w}
        h={h}
        cardWidth={cardWidth}
        annotate={annotate}
      />
    </View>
    <Text
      style={[
        TYPE.sectionHeading,
        { color: COLORS.ink, letterSpacing: 2, marginTop: 18, marginBottom: 8, textAlign: 'center' }
      ]}
    >
      {REGION_LABEL[score.region]}
    </Text>
    <MetricRows rows={metricRows(score)} />
  </FadeIn>
);

interface RegionDetailsProps {
  kind: 'corners' | 'edges';
  slabKey: string;
  grade: number;
  scores: Score[];
}

/**
 * CORNER DETAILS / EDGE DETAILS body. One group per side, and only regions
 * with a metric below 1000. With none at all, a single "clean" line.
 */
export const RegionDetails: React.FC<RegionDetailsProps> = ({ kind, slabKey, grade, scores }) => {
  const [annotate, setAnnotate] = useState<Record<Side, boolean>>({ FRONT: true, BACK: true });
  const [boxW, setBoxW] = useState(340);
  const groups = SIDES.map((side) => ({
    side,
    items: scores.filter((s) => s.side === side && isImperfect(s))
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return <EmptyLine text={kind === 'corners' ? 'All corners clean' : 'All edges clean'} />;
  }

  const noun = kind === 'corners' ? 'Corners' : 'Edges';
  const cornerSize = Math.min(150, Math.floor((boxW - 24 - 2 * 16) / 2));
  const stripW = Math.min(360, boxW - 16 - 8);

  const tileFor = (s: Score) => {
    const horizontalEdge = s.region === 'TOP' || s.region === 'BOTTOM';
    const verticalEdge = s.region === 'LEFT' || s.region === 'RIGHT';
    if (horizontalEdge) {
      return { w: stripW, h: 52, cardWidth: stripW };
    }
    if (verticalEdge) {
      const h = 240;
      return { w: 52, h, cardWidth: Math.round((h * 63) / 88) };
    }
    return { w: cornerSize, h: cornerSize, cardWidth: cornerSize * 2.6 };
  };

  return (
    <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      {groups.map((g, gi) => {
        const letter = g.side === 'FRONT' ? 'F' : 'B';
        const strips = g.items.filter((s) => s.region === 'TOP' || s.region === 'BOTTOM');
        const grid = g.items.filter((s) => !(s.region === 'TOP' || s.region === 'BOTTOM'));
        return (
          <View
            key={g.side}
            style={{
              paddingTop: gi === 0 ? 0 : 32,
              marginTop: gi === 0 ? 0 : 32,
              borderTopWidth: gi === 0 ? 0 : 1,
              borderTopColor: COLORS.line
            }}
          >
            <BlockHeading
              icon={
                <ReportIcon
                  name={kind}
                  letter={letter}
                  size={56}
                  color={COLORS.ink}
                  strokeWidth={1.6}
                />
              }
              title={`${g.side === 'FRONT' ? 'Front' : 'Back'} ${noun}`}
            />
            <Checkbox
              label="Display measurement annotations"
              checked={annotate[g.side]}
              onChange={(v) => setAnnotate((a) => ({ ...a, [g.side]: v }))}
            />

            <View style={{ marginTop: 24, gap: 36 }}>
              {strips.map((s) => (
                <CropTile
                  key={s.region}
                  slabKey={slabKey}
                  grade={grade}
                  score={s}
                  annotate={annotate[g.side]}
                  {...tileFor(s)}
                />
              ))}
              {grid.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    columnGap: 24,
                    rowGap: 36
                  }}
                >
                  {grid.map((s) => (
                    <CropTile
                      key={s.region}
                      slabKey={slabKey}
                      grade={grade}
                      score={s}
                      annotate={annotate[g.side]}
                      {...tileFor(s)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

type DetailsProps = Omit<RegionDetailsProps, 'kind'>;

/** CORNER DETAILS section body. */
export const CornerDetails: React.FC<DetailsProps> = (p) => <RegionDetails kind="corners" {...p} />;

/** EDGE DETAILS section body: horizontal strips for top/bottom, vertical for left/right. */
export const EdgeDetails: React.FC<DetailsProps> = (p) => <RegionDetails kind="edges" {...p} />;
