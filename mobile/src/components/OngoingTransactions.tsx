import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TRANSFER_WINDOW_SECONDS, type TransferRecord } from '../api/transfer';
import { useNow } from '../hooks/useCountdown';
import { CARD_SHADOW, COLORS, formatCountdown, truncateMiddle } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { Icon } from './Icon';

/** Finished transfers stay in the list for a day so the outcome is visible. */
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function selectOngoingTransfers(
  transfers: TransferRecord[],
  now: number
): TransferRecord[] {
  return transfers
    .filter(
      (t) =>
        t.status === 'PENDING' ||
        ((t.status === 'COMPLETED' || t.status === 'EXPIRED') &&
          now - t.deadline < RECENT_WINDOW_MS)
    )
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 6);
}

function statusVisual(t: TransferRecord): {
  label: string;
  fg: string;
  bg: string;
  bar: string;
} {
  switch (t.status) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        fg: COLORS.emeraldDark,
        bg: COLORS.emeraldSoft,
        bar: COLORS.emerald
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        fg: COLORS.roseDark,
        bg: COLORS.roseSoft,
        bar: COLORS.rose
      };
    default:
      return {
        label: 'Awaiting recipient tap',
        fg: COLORS.amberDark,
        bg: COLORS.amberSoft,
        bar: COLORS.amber
      };
  }
}

interface OngoingTransactionsProps {
  transfers: TransferRecord[];
  onOpen: (transfer: TransferRecord) => void;
}

export const OngoingTransactions: React.FC<OngoingTransactionsProps> = ({
  transfers,
  onOpen
}) => {
  const hasPending = transfers.some((t) => t.status === 'PENDING');
  const now = useNow(hasPending);
  const items = selectOngoingTransfers(transfers, now);

  return (
    <View>
      <Text
        style={[TYPE.sectionHeading, { color: COLORS.ink, marginBottom: 12 }]}
      >
        Ongoing transactions
      </Text>

      {items.length === 0 ? (
        <View
          style={[
            CARD_SHADOW,
            { borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18 }
          ]}
        >
          <Text style={[TYPE.bodyMedium, { color: COLORS.inkSecondary }]}>
            No ongoing transactions.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((t) => {
            const vis = statusVisual(t);
            const total = TRANSFER_WINDOW_SECONDS * 1000;
            const remaining = Math.max(0, t.deadline - now);
            const secondsLeft = Math.ceil(remaining / 1000);
            // Bar shows the 120 s window: it drains as time runs out.
            const pct =
              t.status === 'PENDING'
                ? Math.max(0, Math.min(100, (remaining / total) * 100))
                : 100;
            return (
              <TouchableOpacity
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`${t.slabShort ?? 'Slab'} to ${truncateMiddle(t.to, 6, 4)}, ${vis.label}`}
                onPress={() => onOpen(t)}
                activeOpacity={0.85}
                style={[
                  CARD_SHADOW,
                  { borderRadius: 18, padding: 16, gap: 12 }
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: COLORS.paleSoft,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon name="chain" size={18} color={COLORS.pale} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={[TYPE.listItemTitle, { color: COLORS.ink }]}
                    >
                      {t.slabShort ?? 'Slab'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[TYPE.small, { color: COLORS.inkSecondary }]}
                    >
                      To <Text style={TYPE.mono}>{truncateMiddle(t.to, 6, 4)}</Text>
                    </Text>
                  </View>
                  {t.status === 'PENDING' && (
                    <Text style={[TYPE.smallSemiBold, { color: COLORS.inkSecondary }]}>
                      {formatCountdown(secondsLeft)} left
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <View
                    style={{
                      backgroundColor: vis.bg,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4
                    }}
                  >
                    <Text style={[TYPE.chip, { color: vis.fg }]}>
                      {vis.label}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: COLORS.line,
                    overflow: 'hidden'
                  }}
                >
                  <View
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: vis.bar
                    }}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};
