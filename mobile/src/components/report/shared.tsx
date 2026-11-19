import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import Svg, { Defs, LinearGradient, Polyline, Rect, Stop } from 'react-native-svg';
import type { Region, Side } from '../../types/report';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { MockCard } from '../MockCard';
import { ReportIcon } from './ReportIcon';

/* ------------------------------------------------------------------ */
/* Scroll context: lets blocks fade in on first view and jump around.  */
/* ------------------------------------------------------------------ */

type Listener = () => void;

export interface ReportScrollApi {
  /** Called on every scroll event (throttled by the ScrollView). */
  subscribe: (fn: Listener) => () => void;
  /** When true, blocks render fully visible with no animation. */
  instant: boolean;
  /** Scroll so the given content y sits near the top. */
  scrollToY: (y: number) => void;
  /** The node that scroll offsets are measured against. */
  contentRef: React.RefObject<View>;
}

export const ReportScrollContext = createContext<ReportScrollApi | null>(null);

export function useReportScroll(): ReportScrollApi | null {
  return useContext(ReportScrollContext);
}

/**
 * Fades its children in (single 200 ms fade) the first time they enter the
 * viewport. Renders immediately when reduced motion is on.
 */
export const FadeIn: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style
}) => {
  const ctx = useReportScroll();
  const instant = !ctx || ctx.instant;
  const opacity = useRef(new Animated.Value(instant ? 1 : 0)).current;
  const ref = useRef<View>(null);
  const shown = useRef(instant);

  useEffect(() => {
    if (instant) {
      shown.current = true;
      opacity.setValue(1);
      return;
    }
    const check = () => {
      if (shown.current || !ref.current) return;
      ref.current.measureInWindow((_x, y, _w, h) => {
        if (shown.current) return;
        const winH = Dimensions.get('window').height;
        if (h > 0 && y < winH && y + h > 0) {
          shown.current = true;
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web'
          }).start();
        }
      });
    };
    const unsub = ctx!.subscribe(check);
    const t = setTimeout(check, 60);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [instant, ctx, opacity]);

  return (
    <Animated.View ref={ref} style={[style, { opacity }]} collapsable={false}>
      {children}
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

interface SegmentedToggleProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}

/** Two-or-more option toggle. The selected option is a raised outlined pill. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  label
}: SegmentedToggleProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: COLORS.bgRaised,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.line,
        padding: 3
      }}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={`${opt.toLowerCase()} side`}
            onPress={() => onChange(opt)}
            style={{
              minWidth: 92,
              minHeight: 40,
              paddingHorizontal: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? COLORS.cardHi : 'transparent',
              borderWidth: 1,
              borderColor: selected ? COLORS.inkSoft : 'transparent'
            }}
          >
            <Text
              style={[
                TYPE.micro,
                {
                  fontSize: 13,
                  letterSpacing: 1.5,
                  color: selected ? COLORS.ink : COLORS.muted
                }
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const Checkbox: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <TouchableOpacity
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
    onPress={() => onChange(!checked)}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 12,
      minHeight: 44,
      paddingHorizontal: 4
    }}
  >
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: checked ? COLORS.yellow : COLORS.lineStrong,
        backgroundColor: checked ? COLORS.yellow : 'transparent',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {checked && (
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Polyline
            points="20 6 9 17 4 12"
            stroke={COLORS.onAccent}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </View>
    <Text style={[TYPE.small, { color: COLORS.inkSoft }]}>{label}</Text>
  </TouchableOpacity>
);

/** Small round info button. Shows the explanation through the app toast. */
export const InfoButton: React.FC<{ label: string; onPress: () => void; size?: number }> = ({
  label,
  onPress,
  size = 16
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`About ${label}`}
    onPress={onPress}
    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
  >
    <ReportIcon name="info" size={size} color={COLORS.muted} strokeWidth={1.8} />
  </TouchableOpacity>
);

/* ------------------------------------------------------------------ */
/* Brand + frames                                                      */
/* ------------------------------------------------------------------ */

/** "SlabLock" wordmark in Lexend Deca, inside a light box. */
export const Wordmark: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <View
    style={{
      backgroundColor: COLORS.ink,
      paddingHorizontal: size * 0.55,
      paddingVertical: size * 0.22,
      borderRadius: 3
    }}
  >
    <Text
      style={{
        fontFamily: FONT_FAMILIES.lexendBold,
        fontSize: size,
        lineHeight: size * 1.2,
        color: COLORS.bg,
        letterSpacing: 0.3
      }}
    >
      SlabLock
    </Text>
  </View>
);

/** Raised frame used around the card and every crop (stands in for their white frame). */
export const FRAME: ViewStyle = {
  // Reuse the app's card shadow; only the surface and border change.
  ...CARD_SHADOW,
  backgroundColor: COLORS.cardHi,
  borderWidth: 1,
  borderColor: COLORS.lineStrong,
  borderRadius: 6,
  padding: 8
};

/** Tall rounded tile used by the stat and summary blocks. */
export const TILE: ViewStyle = {
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: 22,
  alignItems: 'center'
};

/* ------------------------------------------------------------------ */
/* Card faces and crops                                                */
/* ------------------------------------------------------------------ */

/** Back of the placeholder card: same frame as MockCard, no artwork. */
export const MockCardBack: React.FC<{ id: string; width: number }> = ({ id, width }) => {
  const height = Math.round((width * 88) / 63);
  const frame = Math.max(3, Math.round(width * 0.07));
  const radius = Math.max(6, Math.round(width * 0.09));
  const gradId = `mockBack_${id}`;
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={COLORS.yellowDeep} />
            <Stop offset="100%" stopColor={COLORS.yellow} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${gradId})`} />
        <Rect
          x={frame}
          y={frame}
          width={width - frame * 2}
          height={height - frame * 2}
          rx={Math.max(3, radius - frame)}
          fill={COLORS.cardHi}
        />
        <Rect
          x={width * 0.3}
          y={height * 0.5 - width * 0.2}
          width={width * 0.4}
          height={width * 0.4}
          rx={width * 0.2}
          fill="none"
          stroke={COLORS.lineStrong}
          strokeWidth={Math.max(1, width * 0.012)}
        />
      </Svg>
    </View>
  );
};

export const CardFace: React.FC<{ id: string; side: Side; width: number; grade: number }> = ({
  id,
  side,
  width,
  grade
}) =>
  side === 'FRONT' ? (
    <MockCard id={`${id}_f`} grade={grade} width={width} />
  ) : (
    <MockCardBack id={`${id}_b`} width={width} />
  );

/**
 * A zoomed crop of the placeholder card at one region. The card is drawn at
 * `cardWidth` and shifted so the region sits inside the `w` x `h` window.
 */
export const CardCrop: React.FC<{
  id: string;
  side: Side;
  region: Region;
  grade: number;
  w: number;
  h: number;
  cardWidth: number;
  annotate: boolean;
}> = ({ id, side, region, grade, w, h, cardWidth, annotate }) => {
  const cardHeight = Math.round((cardWidth * 88) / 63);
  const frameInset = Math.max(3, Math.round(cardWidth * 0.07));
  const right = region.includes('RIGHT');
  const bottom = region.includes('BOTTOM');
  const centerX = region === 'TOP' || region === 'BOTTOM';
  const centerY = region === 'LEFT' || region === 'RIGHT';

  const left = right ? w - cardWidth : centerX ? (w - cardWidth) / 2 : 0;
  const top = bottom ? h - cardHeight : centerY ? (h - cardHeight) / 2 : 0;

  // Measurement guides sit on the card's outer edge and its inner frame.
  const guides: Array<{ x?: number; y?: number }> = [];
  if (!centerY) {
    const edgeY = bottom ? h - 0.5 : 0.5;
    const frameY = bottom ? h - frameInset : frameInset;
    guides.push({ y: edgeY }, { y: frameY });
  }
  if (!centerX) {
    const edgeX = right ? w - 0.5 : 0.5;
    const frameX = right ? w - frameInset : frameInset;
    guides.push({ x: edgeX }, { x: frameX });
  }

  return (
    <View style={{ width: w, height: h, overflow: 'hidden', backgroundColor: COLORS.bg }}>
      <View style={{ position: 'absolute', left, top }}>
        <CardFace id={id} side={side} width={cardWidth} grade={grade} />
      </View>
      {annotate &&
        guides.map((g, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              backgroundColor: COLORS.yellow,
              opacity: 0.55,
              ...(g.y !== undefined
                ? { left: 0, right: 0, top: g.y, height: 1 }
                : { top: 0, bottom: 0, left: g.x, width: 1 })
            }}
          />
        ))}
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Regions, numbers and dates                                          */
/* ------------------------------------------------------------------ */

export const REGION_LABEL: Record<Region, string> = {
  TOP_LEFT: 'Top left',
  TOP_RIGHT: 'Top right',
  BOTTOM_LEFT: 'Bottom left',
  BOTTOM_RIGHT: 'Bottom right',
  TOP: 'Top',
  BOTTOM: 'Bottom',
  LEFT: 'Left',
  RIGHT: 'Right'
};

const REGION_POINT: Record<Region, { x: number; y: number }> = {
  TOP_LEFT: { x: 0.05, y: 0.04 },
  TOP_RIGHT: { x: 0.95, y: 0.04 },
  BOTTOM_LEFT: { x: 0.05, y: 0.96 },
  BOTTOM_RIGHT: { x: 0.95, y: 0.96 },
  // Edge points sit off the centre lines so they never cover the C / W / H labels.
  TOP: { x: 0.24, y: 0.015 },
  BOTTOM: { x: 0.76, y: 0.985 },
  LEFT: { x: 0.02, y: 0.24 },
  RIGHT: { x: 0.98, y: 0.76 }
};

/**
 * Where a ding sits on the card, as a 0–1 fraction of width and height.
 * Surface dings are pulled toward the middle so they read as "on the face".
 */
export function dingPoint(region: Region, type: 'SURFACE' | 'CORNER' | 'EDGE') {
  const p = REGION_POINT[region];
  if (type !== 'SURFACE') return p;
  return { x: 0.5 + (p.x - 0.5) * 0.6, y: 0.5 + (p.y - 0.5) * 0.6 };
}

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** `DD/MM/YY` in Asia/Jakarta time (UTC+7, no DST), done by hand for Hermes. */
export function formatShortDate(iso: string): string {
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00+07:00` : iso);
  if (Number.isNaN(t)) return '';
  const d = new Date(t + 7 * 60 * 60 * 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${String(d.getUTCFullYear()).slice(2)}`;
}

/** Label/value metric rows ("Fray: 972"). Values below 1000 use the accent. */
export const MetricRows: React.FC<{ rows: Array<[string, number]>; align?: 'center' | 'left' }> = ({
  rows
}) => (
  <View style={{ gap: 2, alignSelf: 'center' }}>
    {rows.map(([label, value]) => (
      <View key={label} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={[TYPE.small, { color: COLORS.muted, width: 56, letterSpacing: 0.8 }]}>
          {label}:
        </Text>
        <Text
          style={{
            fontFamily: FONT_FAMILIES.lexendBold,
            fontSize: 14,
            letterSpacing: 0.8,
            color: value < 1000 ? COLORS.yellow : COLORS.ink
          }}
        >
          {value}
        </Text>
      </View>
    ))}
  </View>
);

/** Centered uppercase sub-heading with an icon above (FRONT CORNERS, DINGS…). */
export const BlockHeading: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <View style={{ alignItems: 'center', gap: 10, marginBottom: 16 }}>
    {icon}
    <Text style={[TYPE.sectionHeading, { color: COLORS.ink, letterSpacing: 2 }]}>{title}</Text>
  </View>
);

/** Muted single-line empty state, centered. */
export const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <Text
    style={[
      TYPE.body,
      { color: COLORS.muted, textAlign: 'center', paddingVertical: 28 }
    ]}
  >
    {text}
  </Text>
);
