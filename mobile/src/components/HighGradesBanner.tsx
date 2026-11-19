import React from 'react';
import { Platform, Text, type TextStyle, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { SlabItem } from '../data/demo';
import { COLORS, formatGradedDate } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { Button } from './Button';
import { Icon } from './Icon';
import { MockCard } from './MockCard';

interface HighGradesBannerProps {
  slabs: SlabItem[];
  onViewSlab: (slab: SlabItem) => void;
  onScan: () => void;
}

/** Most recently graded Gem Mint (overall 10.0) slab, or null. */
export function latestGemMint(slabs: SlabItem[]): SlabItem | null {
  const tens = slabs.filter((s) => s.overallGrade >= 10);
  if (tens.length === 0) return null;
  return tens.reduce((best, s) =>
    Date.parse(s.gradedAt) > Date.parse(best.gradedAt) ? s : best
  );
}

/**
 * Highlighted headline word: mauve-to-pink gradient text on web, solid pink on
 * native (gradient text needs a masked view there).
 */
const HIGHLIGHT: TextStyle = Platform.select({
  web: {
    color: COLORS.pink,
    backgroundImage: `linear-gradient(90deg, ${COLORS.mauve}, ${COLORS.pink})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  } as unknown as TextStyle,
  default: { color: COLORS.pink }
}) as TextStyle;

/** "Latest high grades" banner on Home: dark card with a mauve / yellow glow. */
export const HighGradesBanner: React.FC<HighGradesBannerProps> = ({
  slabs,
  onViewSlab,
  onScan
}) => {
  const latest = latestGemMint(slabs);

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.line,
        backgroundColor: COLORS.card
      }}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <LinearGradient id="highGradesGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={COLORS.mauve} stopOpacity="0.22" />
            <Stop offset="55%" stopColor={COLORS.pink} stopOpacity="0.06" />
            <Stop offset="100%" stopColor={COLORS.yellow} stopOpacity="0.16" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#highGradesGrad)" />
      </Svg>

      <View
        style={{
          padding: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.micro, { color: COLORS.pale, marginBottom: 8 }]}>
            New this week
          </Text>
          <Text
            style={[
              TYPE.h2,
              { color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 1.6 }
            ]}
          >
            Newly graded{" "}
            <Text style={[HIGHLIGHT, { textTransform: "none" }]}>10s</Text>
          </Text>

          {latest ? (
            <>
              <Text
                style={[
                  TYPE.bodyMedium,
                  { color: COLORS.inkSoft, marginTop: 8, marginBottom: 16 }
                ]}
              >
                {latest.short} · graded {formatGradedDate(latest.gradedAt)}
              </Text>
              <Button
                label="View slab"
                variant="white"
                icon={<Icon name="chevron-right" size={16} color={COLORS.bg} />}
                onPress={() => onViewSlab(latest)}
                style={{ alignSelf: 'flex-start' }}
              />
            </>
          ) : (
            <>
              <Text
                style={[
                  TYPE.bodyMedium,
                  { color: COLORS.inkSoft, marginTop: 8, marginBottom: 16 }
                ]}
              >
                No Gem Mint slabs scanned yet
              </Text>
              <Button
                label="Scan a slab"
                variant="white"
                icon={<Icon name="nfc" size={16} color={COLORS.bg} />}
                onPress={onScan}
                style={{ alignSelf: 'flex-start' }}
              />
            </>
          )}
        </View>

        {latest && (
          <View style={{ transform: [{ rotate: '6deg' }] }}>
            <MockCard id="banner" grade={latest.overallGrade} width={78} />
          </View>
        )}
      </View>
    </View>
  );
};
