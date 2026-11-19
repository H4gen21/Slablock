import { useEffect, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

interface PanOptions {
  enabled: boolean;
  /** Largest allowed |offset| on each axis. */
  maxX: number;
  maxY: number;
}

/**
 * Drag-to-pan using the RN responder system (same approach the old
 * MacroLoupe used for its lens, so it also works with a mouse on web).
 * Returns the clamped offset plus the responder props to spread on a View.
 */
export function usePan({ enabled, maxX, maxY }: PanOptions) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

  // Re-clamp when zoom changes the bounds; reset when panning is turned off.
  useEffect(() => {
    setOffset((o) =>
      enabled ? { x: clamp(o.x, maxX), y: clamp(o.y, maxY) } : { x: 0, y: 0 }
    );
  }, [enabled, maxX, maxY]);

  const grant = (e: GestureResponderEvent) => {
    start.current = {
      px: e.nativeEvent.pageX,
      py: e.nativeEvent.pageY,
      x: offset.x,
      y: offset.y
    };
  };

  const move = (e: GestureResponderEvent) => {
    const s = start.current;
    setOffset({
      x: clamp(s.x + e.nativeEvent.pageX - s.px, maxX),
      y: clamp(s.y + e.nativeEvent.pageY - s.py, maxY)
    });
  };

  const panHandlers = {
    onStartShouldSetResponder: () => enabled,
    onMoveShouldSetResponder: () => enabled,
    onResponderGrant: grant,
    onResponderMove: move,
    // Keep the drag while zoomed instead of handing it to the ScrollView.
    onResponderTerminationRequest: () => !enabled
  };

  return { offset, panHandlers };
}
