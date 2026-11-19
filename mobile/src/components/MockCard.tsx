import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../theme/tokens';
import { FONT_FAMILIES } from '../theme/typography';

interface MockCardProps {
  /** Used to keep SVG gradient ids unique. */
  id: string;
  grade: number;
  width: number;
}

/**
 * Placeholder trading card: a plain card-sized rectangle (63:88) with a
 * yellow gradient frame, a placeholder title bar and the grade in the corner.
 * Deliberately has no artwork.
 */
export const MockCard: React.FC<MockCardProps> = ({ id, grade, width }) => {
  const height = Math.round((width * 88) / 63);
  const frame = Math.max(3, Math.round(width * 0.07));
  const radius = Math.max(6, Math.round(width * 0.09));
  const small = width < 80;
  const gradId = `mockFrame_${id}`;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius, overflow: 'hidden' }}
    >
      <Svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={COLORS.yellow} />
            <Stop offset="55%" stopColor={COLORS.yellow} />
            <Stop offset="100%" stopColor={COLORS.yellowDeep} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${gradId})`} />
        <Rect
          x={frame}
          y={frame}
          width={width - frame * 2}
          height={height - frame * 2}
          rx={Math.max(3, radius - frame)}
          fill={COLORS.card}
        />
        {/* Placeholder title bar */}
        <Rect
          x={frame * 2}
          y={frame * 2}
          width={(width - frame * 4) * (small ? 0.55 : 0.6)}
          height={Math.max(4, Math.round(height * 0.045))}
          rx={2}
          fill={COLORS.lineStrong}
        />
        {/* Placeholder window */}
        <Rect
          x={frame * 2}
          y={frame * 2 + height * 0.09}
          width={width - frame * 4}
          height={height * 0.44}
          rx={Math.max(2, radius - frame * 1.5)}
          fill={COLORS.cardHi}
          stroke={COLORS.lineStrong}
          strokeWidth={1}
        />
        {/* Placeholder text lines */}
        {!small && (
          <>
            <Rect
              x={frame * 2}
              y={frame * 2 + height * 0.58}
              width={(width - frame * 4) * 0.85}
              height={Math.max(3, height * 0.03)}
              rx={2}
              fill={COLORS.lineStrong}
            />
            <Rect
              x={frame * 2}
              y={frame * 2 + height * 0.64}
              width={(width - frame * 4) * 0.65}
              height={Math.max(3, height * 0.03)}
              rx={2}
              fill={COLORS.lineStrong}
            />
          </>
        )}
      </Svg>

      {/* Grade in the corner */}
      <View
        style={{
          position: 'absolute',
          right: frame + 1,
          bottom: frame + 1,
          minWidth: small ? 20 : 34,
          paddingHorizontal: small ? 3 : 6,
          paddingVertical: small ? 1 : 3,
          borderRadius: small ? 5 : 8,
          backgroundColor: COLORS.bg,
          alignItems: 'center'
        }}
      >
        <Text
          style={{
            color: COLORS.yellow,
            fontFamily: FONT_FAMILIES.lexendBold,
            fontSize: small ? 9 : Math.round(width * 0.075),
            lineHeight: small ? 12 : Math.round(width * 0.1)
          }}
        >
          {Number.isInteger(grade) ? grade : grade.toFixed(1)}
        </Text>
      </View>
    </View>
  );
};
