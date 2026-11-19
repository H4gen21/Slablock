import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Ding } from '../../types/report';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { ReportIcon } from './ReportIcon';
import { BlockHeading, REGION_LABEL } from './shared';

const COLS = [
  { key: 'id', label: 'ID', width: 64 },
  { key: 'side', label: 'Side', width: 96 },
  { key: 'type', label: 'Type', width: 100 },
  { key: 'location', label: 'Location', width: 220 }
] as const;
const TABLE_W = COLS.reduce((sum, c) => sum + c.width, 0);

interface DingsTableProps {
  dings: Ding[];
  highlightId: string | null;
  /** Lets the screen scroll to a row when its marker is tapped on the map. */
  registerRow: (id: string, node: View | null) => void;
}

const SIDE_ORDER = { FRONT: 0, BACK: 1 } as const;

/** "DINGS" heading plus an ID / Side / Type / Location table, sortable by side. */
export const DingsTable: React.FC<DingsTableProps> = ({ dings, highlightId, registerRow }) => {
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const rows = [...dings].sort((a, b) => {
    const d = SIDE_ORDER[a.side] - SIDE_ORDER[b.side];
    return dir === 'asc' ? d : -d;
  });

  const empty = rows.length === 0;
  const cell = (width: number) => ({
    // Empty table: columns share the visible width instead of scrolling.
    ...(empty ? { flex: width } : { width }),
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.line
  });

  return (
    <View>
      <BlockHeading
        icon={<ReportIcon name="pin" size={44} color={COLORS.ink} strokeWidth={1.8} />}
        title="Dings"
      />

      <View
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.line,
          backgroundColor: COLORS.card,
          overflow: 'hidden'
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={rows.length > 0}
          scrollEnabled={rows.length > 0}
          // Empty: shrink to the visible width so the empty state stays centered.
          contentContainerStyle={rows.length === 0 ? { flexGrow: 1 } : undefined}
        >
          <View style={rows.length === 0 ? { flex: 1 } : { minWidth: TABLE_W }}>
            {/* Header */}
            <View
              accessibilityRole="header"
              style={{
                flexDirection: 'row',
                backgroundColor: COLORS.cardHi,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.lineStrong
              }}
            >
              {COLS.map((c) =>
                c.key === 'side' ? (
                  <TouchableOpacity
                    key={c.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by side, ${dir === 'asc' ? 'front first' : 'back first'}`}
                    onPress={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    style={[cell(c.width), { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                  >
                    <Text style={[TYPE.bodySemiBold, { color: COLORS.ink }]}>{c.label}</Text>
                    <ReportIcon
                      name={dir === 'asc' ? 'sort-down' : 'sort-up'}
                      size={16}
                      color={COLORS.inkSoft}
                    />
                  </TouchableOpacity>
                ) : (
                  <View key={c.key} style={cell(c.width)}>
                    <Text style={[TYPE.bodySemiBold, { color: COLORS.ink }]}>{c.label}</Text>
                  </View>
                )
              )}
            </View>

            {/* Body */}
            {rows.length === 0 ? (
              <View style={{ paddingVertical: 64 }}>
                <Text style={[TYPE.body, { color: COLORS.muted, textAlign: 'center' }]}>
                  No surface defects
                </Text>
              </View>
            ) : (
              rows.map((d, i) => (
                <View
                  key={d.id}
                  ref={(n) => registerRow(d.id, n)}
                  collapsable={false}
                  style={{
                    flexDirection: 'row',
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: COLORS.line,
                    backgroundColor: highlightId === d.id ? COLORS.yellowSoft : 'transparent'
                  }}
                >
                  <View style={[cell(COLS[0].width), { flexDirection: 'row', alignItems: 'center' }]}>
                    <View
                      style={{
                        minWidth: 26,
                        height: 22,
                        borderRadius: 11,
                        paddingHorizontal: 6,
                        backgroundColor: COLORS.danger,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text
                        style={{ fontFamily: FONT_FAMILIES.lexendBold, fontSize: 12, color: COLORS.ink }}
                      >
                        {d.id.replace(/^D/, '')}
                      </Text>
                    </View>
                  </View>
                  <View style={cell(COLS[1].width)}>
                    <Text style={[TYPE.body, { color: COLORS.ink }]}>
                      {d.side === 'FRONT' ? 'Front' : 'Back'}
                    </Text>
                  </View>
                  <View style={cell(COLS[2].width)}>
                    <Text style={[TYPE.body, { color: COLORS.ink }]}>
                      {d.type.charAt(0) + d.type.slice(1).toLowerCase()}
                    </Text>
                  </View>
                  <View style={cell(COLS[3].width)}>
                    <Text style={[TYPE.bodySemiBold, { color: COLORS.ink }]}>
                      {REGION_LABEL[d.region]}
                    </Text>
                    <Text style={[TYPE.small, { color: COLORS.muted, marginTop: 2 }]}>{d.note}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
