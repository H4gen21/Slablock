import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { SlabItem } from '../data/demo';
import { CARD_SHADOW, COLORS, formatGradedDate, getStateTone } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { Chip } from './Chip';
import { MockCard } from './MockCard';
import { Ring } from './Ring';

interface SlabListItemProps {
  slab: SlabItem;
  onPress: (slab: SlabItem) => void;
}

/** Fixed height so cards line up in the 2-column grid. */
export const SLAB_CARD_HEIGHT = 108;

export const SlabListItem: React.FC<SlabListItemProps> = ({
  slab,
  onPress
}) => {
  const toneSpec = getStateTone(slab.onChainState);
  const graded = formatGradedDate(slab.gradedAt);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${slab.short}, ${slab.cardSet}, ${toneSpec.label}, grade ${slab.overallGrade.toFixed(1)}${graded ? `, graded ${graded}` : ''}`}
      onPress={() => onPress(slab)}
      activeOpacity={0.84}
      style={[
        CARD_SHADOW,
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 18,
          paddingVertical: 14,
          paddingHorizontal: 16,
          height: SLAB_CARD_HEIGHT,
          gap: 14
        }
      ]}
    >
      <MockCard id={`list_${slab.key}`} grade={slab.overallGrade} width={56} />

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={[TYPE.listItemTitle, { color: COLORS.ink }]}
        >
          {slab.short}
        </Text>
        <Text
          numberOfLines={1}
          style={[TYPE.small, { color: COLORS.inkSecondary }]}
        >
          {slab.cardSet}
        </Text>
        {graded ? (
          <Text
            numberOfLines={1}
            style={[TYPE.small, { color: COLORS.inkMuted, fontSize: 12, lineHeight: 16 }]}
          >
            Graded {graded}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Chip label={toneSpec.label} tone={toneSpec.tone} />
        </View>
      </View>

      <Ring
        progress={slab.overallGrade * 10}
        size={48}
        strokeWidth={4.5}
        color={toneSpec.ringColor}
        trackColor={
          slab.onChainState === 'SEALED' ? COLORS.yellowSoft : toneSpec.bg
        }
        label={slab.overallGrade.toFixed(1)}
        labelColor={COLORS.ink}
        labelSize={12}
      />
    </TouchableOpacity>
  );
};
