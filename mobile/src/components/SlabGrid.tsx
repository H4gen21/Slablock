import React from 'react';
import { Text, View } from 'react-native';
import type { SlabItem } from '../data/demo';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { Button } from './Button';
import { Icon } from './Icon';
import { SlabListItem } from './SlabListItem';

interface SlabGridProps {
  slabs: SlabItem[];
  /** Two columns at >= 900 px, one column on phones. */
  columns: 1 | 2;
  onPressSlab: (slab: SlabItem) => void;
}

/** Collection grid shared by Home and Collection. */
export const SlabGrid: React.FC<SlabGridProps> = ({
  slabs,
  columns,
  onPressSlab
}) => {
  const rows: SlabItem[][] = [];
  for (let i = 0; i < slabs.length; i += columns) {
    rows.push(slabs.slice(i, i + columns));
  }

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <View
          key={row.map((s) => s.key).join('|')}
          style={{ flexDirection: 'row', gap: 12 }}
        >
          {row.map((slab) => (
            <View key={slab.key} style={{ flex: 1, minWidth: 0 }}>
              <SlabListItem slab={slab} onPress={onPressSlab} />
            </View>
          ))}
          {row.length < columns && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
};

export const EmptySlabsCard: React.FC<{
  message?: string;
  onScan: () => void;
}> = ({
  message = 'No slabs yet. Scan a slab to add it to your collection.',
  onScan
}) => (
  <View
    style={[
      CARD_SHADOW,
      {
        borderRadius: 20,
        padding: 28,
        alignItems: 'center'
      }
    ]}
  >
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.paleSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
      }}
    >
      <Icon name="collection" size={24} color={COLORS.pale} />
    </View>
    <Text
      style={[
        TYPE.bodyMedium,
        {
          color: COLORS.inkSecondary,
          textAlign: 'center',
          marginBottom: 18,
          maxWidth: 320
        }
      ]}
    >
      {message}
    </Text>
    <Button
      label="Scan a slab"
      variant="primary"
      icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
      onPress={onScan}
    />
  </View>
);
