import React from 'react';
import { TouchableOpacity, View, type ViewStyle } from 'react-native';
import { CARD_SHADOW, COLORS } from '../../theme/tokens';
import { ReportIcon } from './ReportIcon';

interface SectionJumperProps {
  bottom: number;
  right: number;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}

const BUTTON: ViewStyle = {
  ...CARD_SHADOW,
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: COLORS.bgRaised,
  borderWidth: 1,
  borderColor: COLORS.lineStrong,
  alignItems: 'center',
  justifyContent: 'center'
};

/** Floating up/down buttons that jump between report sections. */
export const SectionJumper: React.FC<SectionJumperProps> = ({
  bottom,
  right,
  canUp,
  canDown,
  onUp,
  onDown
}) => (
  <View
    pointerEvents="box-none"
    style={{ position: 'absolute', right, bottom, gap: 12, zIndex: 40 }}
  >
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Previous section"
      accessibilityState={{ disabled: !canUp }}
      disabled={!canUp}
      onPress={onUp}
      style={[BUTTON, { opacity: canUp ? 1 : 0.4 }]}
    >
      <ReportIcon name="chevron-up" size={22} color={COLORS.ink} strokeWidth={2.4} />
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Next section"
      accessibilityState={{ disabled: !canDown }}
      disabled={!canDown}
      onPress={onDown}
      style={[BUTTON, { opacity: canDown ? 1 : 0.4 }]}
    >
      <ReportIcon name="chevron-down" size={22} color={COLORS.ink} strokeWidth={2.4} />
    </TouchableOpacity>
  </View>
);
