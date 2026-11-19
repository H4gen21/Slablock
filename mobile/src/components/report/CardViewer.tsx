import React, { useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { usePan } from '../../hooks/usePan';
import type { Ding, Side } from '../../types/report';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { ReportIcon } from './ReportIcon';
import { CardFace, dingPoint, FRAME, InfoButton, SegmentedToggle } from './shared';

const MAX_ZOOM = 8;
const MAX_CARD = 360;
const SIDES = ['FRONT', 'BACK'] as const;

/* ------------------------------ slider ------------------------------ */

const VisibilitySlider: React.FC<{ value: number; onChange: (v: number) => void }> = ({
  value,
  onChange
}) => {
  const [trackW, setTrackW] = useState(1);
  const trackX = useRef(0);
  const trackRef = useRef<View>(null);

  const setFromPage = (pageX: number) => {
    onChange(Math.max(0, Math.min(1, (pageX - trackX.current) / trackW)));
  };

  const onGrant = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    trackRef.current?.measureInWindow((x) => {
      trackX.current = x;
      setFromPage(pageX);
    });
  };

  const pct = Math.round(value * 100);

  return (
    <View
      ref={trackRef}
      accessibilityRole="adjustable"
      accessibilityLabel="Surface defect visibility"
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct}%` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1;
        onChange(Math.max(0, Math.min(1, value + step)));
      }}
      onLayout={(e: LayoutChangeEvent) => setTrackW(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={(e) => setFromPage(e.nativeEvent.pageX)}
      style={{ height: 44, justifyContent: 'center' }}
    >
      <View style={{ height: 3, borderRadius: 2, backgroundColor: COLORS.lineStrong }}>
        <View
          style={{
            width: `${pct}%`,
            height: 3,
            borderRadius: 2,
            backgroundColor: COLORS.ink
          }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: value * trackW - 11,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: COLORS.ink,
          borderWidth: 3,
          borderColor: COLORS.bg
        }}
      />
    </View>
  );
};

/* ------------------------------ viewer ------------------------------ */

interface CardViewerProps {
  slabKey: string;
  grade: number;
  dings: Ding[];
  onInfo: (msg: string) => void;
}

/** Large framed card with a defect overlay slider, front/back toggle and zoom. */
export const CardViewer: React.FC<CardViewerProps> = ({ slabKey, grade, dings, onInfo }) => {
  const [side, setSide] = useState<Side>('FRONT');
  const [zoom, setZoom] = useState(1);
  const [visibility, setVisibility] = useState(1);
  const [boxW, setBoxW] = useState(320);

  const cardW = Math.min(MAX_CARD, Math.max(160, boxW - 18));
  const cardH = Math.round((cardW * 88) / 63);

  const { offset, panHandlers } = usePan({
    enabled: zoom > 1,
    maxX: (cardW * (zoom - 1)) / 2,
    maxY: (cardH * (zoom - 1)) / 2
  });

  const sideDings = dings.filter((d) => d.side === side);

  return (
    <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      {/* Defect visibility */}
      <View style={{ paddingHorizontal: 8, marginBottom: 6 }}>
        <VisibilitySlider value={visibility} onChange={setVisibility} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 4,
            marginBottom: 20
          }}
        >
          <Text style={[TYPE.bodyMedium, { color: COLORS.inkSoft }]}>
            Surface defect visibility
          </Text>
          <InfoButton
            label="surface defect visibility"
            size={18}
            onPress={() =>
              onInfo('Slide to fade the identified defects in or out over the card.')
            }
          />
        </View>
      </View>

      {/* Framed card */}
      <View style={[FRAME, { alignSelf: 'center', padding: 8 }]}>
        <View
          {...panHandlers}
          accessibilityRole="image"
          accessibilityLabel={`${side.toLowerCase()} of the card, ${zoom * 100}% zoom. ${
            sideDings.length
          } defect${sideDings.length === 1 ? '' : 's'} marked.`}
          style={{
            width: cardW,
            height: cardH,
            overflow: 'hidden',
            borderRadius: 4,
            backgroundColor: COLORS.bg,
            ...(zoom > 1 ? ({ cursor: 'grab' } as object) : {})
          }}
        >
          <View
            style={{
              width: cardW,
              height: cardH,
              transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }]
            }}
          >
            <CardFace id={`viewer_${slabKey}`} side={side} width={cardW} grade={grade} />
            {sideDings.map((d) => {
              const p = dingPoint(d.region, d.type);
              // Keep the marker the same on-screen size at every zoom level.
              const r = 12 / zoom;
              return (
                <View
                  key={d.id}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: p.x * cardW - r,
                    top: p.y * cardH - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: r,
                    borderWidth: 2 / zoom,
                    borderColor: COLORS.bg,
                    backgroundColor: COLORS.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: visibility
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_FAMILIES.lexendBold,
                      fontSize: 12 / zoom,
                      lineHeight: 15 / zoom,
                      color: COLORS.ink
                    }}
                  >
                    {d.id.replace(/^D/, '')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Zoom row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          marginTop: 14
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          accessibilityState={{ disabled: zoom <= 1 }}
          disabled={zoom <= 1}
          onPress={() => setZoom((z) => Math.max(1, z - 1))}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ReportIcon name="zoom-out" size={24} color={zoom <= 1 ? COLORS.lineStrong : COLORS.ink} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: FONT_FAMILIES.lexendMedium,
            fontSize: 15,
            color: COLORS.ink,
            minWidth: 52,
            textAlign: 'center'
          }}
        >
          {zoom * 100}%
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          accessibilityState={{ disabled: zoom >= MAX_ZOOM }}
          disabled={zoom >= MAX_ZOOM}
          onPress={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ReportIcon
            name="zoom-in"
            size={24}
            color={zoom >= MAX_ZOOM ? COLORS.lineStrong : COLORS.ink}
          />
        </TouchableOpacity>
      </View>
      {zoom > 1 && (
        <Text style={[TYPE.small, { color: COLORS.muted, textAlign: 'center' }]}>
          Drag the card to pan
        </Text>
      )}

      <View style={{ marginTop: 14 }}>
        <SegmentedToggle
          label="Card side"
          options={SIDES}
          value={side}
          onChange={(s) => {
            setSide(s);
            setZoom(1);
          }}
        />
      </View>
    </View>
  );
};
