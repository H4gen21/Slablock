import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS, type Tone } from '../theme/tokens';
import { SIZES, TYPE } from '../theme/typography';

interface ChipProps {
  label: string;
  tone?: Tone;
  selected?: boolean;
  onPress?: () => void;
  dot?: boolean;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  tone = 'brand',
  selected = false,
  onPress,
  dot = false,
  accessibilityLabel
}) => {
  const toneColors = {
    emerald: {
      bg: COLORS.emeraldSoft,
      fg: COLORS.success,
      dot: COLORS.success,
      border: COLORS.emeraldBorder
    },
    amber: {
      bg: COLORS.amberSoft,
      fg: COLORS.warning,
      dot: COLORS.warning,
      border: COLORS.amberBorder
    },
    rose: {
      bg: COLORS.roseSoft,
      fg: COLORS.danger,
      dot: COLORS.danger,
      border: COLORS.roseBorder
    },
    // Tab-style selector: dark card; the active one gets a brighter border.
    brand: {
      bg: selected ? COLORS.cardHi : COLORS.card,
      fg: selected ? COLORS.ink : COLORS.inkSoft,
      dot: COLORS.yellow,
      border: selected ? COLORS.inkSoft : COLORS.line
    },
    // Neutral / small badges: pale blue.
    slate: {
      bg: COLORS.paleSoft,
      fg: COLORS.pale,
      dot: COLORS.pale,
      border: 'rgba(159,208,255,0.3)'
    }
  }[tone];

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: onPress ? 14 : 10,
        paddingVertical: onPress ? 8 : 5,
        minHeight: onPress ? 34 : 26,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: toneColors.border,
        backgroundColor: toneColors.bg
      }}
    >
      {dot && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: toneColors.dot
          }}
        />
      )}
      <Text
        style={[
          TYPE.chip,
          {
            color: toneColors.fg,
            fontSize: SIZES.chip
          }
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected }}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {content}
    </TouchableOpacity>
  );
};
