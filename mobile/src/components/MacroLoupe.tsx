import React, { useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Text,
  View
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Rect,
  Stop
} from 'react-native-svg';
import type { SlabItem, SubGradeKey } from '../data/demo';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';
import { GradingGrid } from './GradingGrid';

const ZOOM = 3;
const LENS = 110;
const TILE_H = 120;

const LABELS: Record<SubGradeKey, string> = {
  surface: 'Surface',
  edges: 'Edges',
  corners: 'Corners',
  centering: 'Centering'
};

const ORDER: SubGradeKey[] = ['surface', 'edges', 'corners', 'centering'];

/**
 * Placeholder macro texture for one imperfection. Drawn in a 240 x 120
 * viewBox and stretched to the tile; the loupe re-renders it at 3x.
 * TODO: replace with the real macro image from IPFS (`ipfsMetadataCid`).
 */
const ImperfectionTexture: React.FC<{
  kind: SubGradeKey;
  width: number;
  height: number;
  idSuffix: string;
}> = ({ kind, width, height, idSuffix }) => {
  const gradId = `imp_grad_${kind}_${idSuffix}`;
  const dotsId = `imp_dots_${kind}_${idSuffix}`;
  const mark = COLORS.yellowDeep;

  return (
    <Svg width={width} height={height} viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={COLORS.cardHi} />
          <Stop offset="100%" stopColor={COLORS.card} />
        </LinearGradient>
        <Pattern id={dotsId} width={8} height={8} patternUnits="userSpaceOnUse">
          <Circle cx={2} cy={2} r={0.9} fill="rgba(255, 255, 255, 0.06)" />
        </Pattern>
      </Defs>
      <Rect width="240" height="120" fill={`url(#${gradId})`} />
      <Rect width="240" height="120" fill={`url(#${dotsId})`} />

      {kind === 'edges' && (
        <>
          <Line x1="0" y1="96" x2="240" y2="96" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          {[18, 34, 47, 63, 80].map((x) => (
            <Path
              key={x}
              d={`M ${x} 96 l 4 -6 l 4 6`}
              stroke={COLORS.ink}
              strokeWidth="3"
              fill="none"
            />
          ))}
          <Circle cx="48" cy="92" r="30" stroke={mark} strokeWidth="2" fill="none" strokeDasharray="5 4" />
        </>
      )}

      {kind === 'corners' && (
        <>
          <Path d="M 0 22 Q 0 0 22 0" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
          <Path d="M 3 26 Q 6 8 26 3" stroke={COLORS.ink} strokeWidth="4" fill="none" />
          <Circle cx="18" cy="18" r="26" stroke={mark} strokeWidth="2" fill="none" strokeDasharray="5 4" />
        </>
      )}

      {kind === 'centering' && (
        <>
          <Rect x="14" y="12" width="200" height="96" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
          <Line x1="0" y1="60" x2="14" y2="60" stroke={mark} strokeWidth="2" />
          <Line x1="214" y1="60" x2="240" y2="60" stroke={mark} strokeWidth="2" />
          <Path d="M 4 54 L 0 60 L 4 66 M 10 54 L 14 60 L 10 66" stroke={mark} strokeWidth="1.5" fill="none" />
          <Path d="M 218 54 L 214 60 L 218 66 M 236 54 L 240 60 L 236 66" stroke={mark} strokeWidth="1.5" fill="none" />
        </>
      )}

      {kind === 'surface' && (
        <>
          <Path d="M 70 30 C 110 44, 140 52, 190 84" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" fill="none" />
          <Path d="M 72 33 C 112 47, 142 55, 192 87" stroke="rgba(0,0,0,0.5)" strokeWidth="1" fill="none" />
          <Circle cx="130" cy="56" r="34" stroke={mark} strokeWidth="2" fill="none" strokeDasharray="5 4" />
        </>
      )}
    </Svg>
  );
};

interface LensPos {
  x: number;
  y: number;
}

interface MacroLoupeProps {
  kind: SubGradeKey;
  grade: number;
  description: string;
  idSuffix: string;
}

/** One imperfection tile with a tap-to-zoom loupe (3x zoom, 110 px lens). */
export const MacroLoupe: React.FC<MacroLoupeProps> = ({
  kind,
  grade,
  description,
  idSuffix
}) => {
  const [lens, setLens] = useState<LensPos | null>(null);
  const [tileW, setTileW] = useState<number>(240);

  const clampPos = (x: number, y: number): LensPos => ({
    x: Math.max(0, Math.min(tileW, x)),
    y: Math.max(0, Math.min(TILE_H, y))
  });

  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setLens(clampPos(locationX ?? tileW / 2, locationY ?? TILE_H / 2));
  };

  return (
    <View
      style={{
        flex: 1,
        minWidth: 150,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.line
      }}
    >
      <View
        accessibilityRole="image"
        accessibilityLabel={`${LABELS[kind]} close-up. Touch and drag to zoom.`}
        onLayout={(e: LayoutChangeEvent) => setTileW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setLens(null)}
        // @ts-expect-error web-only mouse events for the hover loupe
        onMouseMove={(e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
          setLens(clampPos(e.nativeEvent.offsetX ?? tileW / 2, e.nativeEvent.offsetY ?? TILE_H / 2));
        }}
        onMouseLeave={() => setLens(null)}
        style={{ height: TILE_H, width: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <ImperfectionTexture kind={kind} width={tileW} height={TILE_H} idSuffix={`${idSuffix}_base`} />

        {lens && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: lens.x - LENS / 2,
              top: lens.y - LENS / 2,
              width: LENS,
              height: LENS,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: COLORS.inkSoft,
              overflow: 'hidden',
              backgroundColor: COLORS.bgElevated,
              shadowColor: '#000',
              shadowOpacity: 0.22,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 }
            }}
          >
            {/* Same texture at 3x, shifted so the lens centre shows the point under the finger. */}
            <View
              style={{
                position: 'absolute',
                left: LENS / 2 - 3 - lens.x * ZOOM,
                top: LENS / 2 - 3 - lens.y * ZOOM
              }}
            >
              <ImperfectionTexture
                kind={kind}
                width={tileW * ZOOM}
                height={TILE_H * ZOOM}
                idSuffix={`${idSuffix}_zoom`}
              />
            </View>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 12, paddingVertical: 10, gap: 3 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Text style={[TYPE.smallSemiBold, { color: COLORS.ink }]}>
            {LABELS[kind]}
          </Text>
          <Text
            style={{
              fontFamily: FONT_FAMILIES.lexendSemiBold,
              fontSize: 14,
              color: COLORS.yellowDeep
            }}
          >
            {grade.toFixed(1)}
          </Text>
        </View>
        <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

interface ImperfectionsSectionProps {
  slab: SlabItem;
}

/**
 * "Surface & edge imperfections": the grading grid plus one tile per
 * sub-grade below 10.0. Perfect sub-grades are null and are not drawn.
 */
export const ImperfectionsSection: React.FC<ImperfectionsSectionProps> = ({
  slab
}) => {
  // TODO: load the real macro images from IPFS via `slab.ipfsMetadataCid`.
  const tiles = ORDER.map((kind) => {
    const grade = slab.subGrades[kind];
    if (grade >= 10) return null;
    return {
      kind,
      grade,
      description:
        slab.imperfections?.[kind] ?? `${LABELS[kind]} graded below 10.`
    };
  }).filter((t): t is { kind: SubGradeKey; grade: number; description: string } => t !== null);

  return (
    <View
      style={[
        CARD_SHADOW,
        {
          borderRadius: 20,
          padding: 20,
          marginBottom: 16
        }
      ]}
    >
      <Text style={[TYPE.micro, { color: COLORS.muted, marginBottom: 6 }]}>
        Inspection points
      </Text>
      <Text
        style={[TYPE.sectionHeading, { color: COLORS.ink, marginBottom: 12 }]}
      >
        Surface & edge imperfections
      </Text>

      <GradingGrid subGrades={slab.subGrades} />

      {tiles.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 14
          }}
        >
          {tiles.map((t) => (
            <MacroLoupe
              key={t.kind}
              kind={t.kind}
              grade={t.grade}
              description={t.description}
              idSuffix={slab.key}
            />
          ))}
        </View>
      )}
    </View>
  );
};
