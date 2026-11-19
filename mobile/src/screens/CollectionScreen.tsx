import React from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Chip } from '../components/Chip';
import { EmptySlabsCard, SlabGrid } from '../components/SlabGrid';
import { type CollectionFilter, useApp } from '../state/AppContext';
import { COLORS } from '../theme/tokens';
import { TYPE } from '../theme/typography';

const FILTERS: CollectionFilter[] = ['All', 'Sealed', 'In transit'];

export const CollectionScreen: React.FC = () => {
  const { slabs, filter, setFilter, openSlabDetail, navigate, viewportMode } =
    useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 900 && viewportMode !== 'mobile';

  const filtered = slabs.filter((s) => {
    if (filter === 'Sealed') return s.onChainState === 'SEALED';
    if (filter === 'In transit') return s.onChainState === 'IN_TRANSIT';
    return true;
  });

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 132,
        maxWidth: 1040,
        width: '100%',
        alignSelf: 'center'
      }}
      style={{ flex: 1 }}
    >
      <Text style={[TYPE.h1, { color: COLORS.ink, marginBottom: 16 }]}>
        Collection
      </Text>

      {slabs.length === 0 ? (
        <EmptySlabsCard onScan={() => navigate('Scan')} />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 20
            }}
          >
            {FILTERS.map((f) => (
              <Chip
                key={f}
                label={f}
                tone="brand"
                selected={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </View>

          {filtered.length === 0 ? (
            <EmptySlabsCard
              message="No slabs in this state yet."
              onScan={() => navigate('Scan')}
            />
          ) : (
            <SlabGrid
              slabs={filtered}
              columns={isWide ? 2 : 1}
              onPressSlab={(picked) => openSlabDetail(picked, false)}
            />
          )}
        </>
      )}
    </ScrollView>
  );
};
