import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { verifyTap } from '../api/verify';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { type DemoTriggerScenario } from '../components/DevDemoBottomSheet';
import { Icon } from '../components/Icon';
import { NfcRadar } from '../components/NfcRadar';
import { ReplayRejectedModal } from '../components/ReplayRejectedModal';
import { SCENARIOS } from '../data/demo';
import { scanPhysicalNtag424 } from '../nfc/sunReader';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { TYPE } from '../theme/typography';

export const ScanScreen: React.FC = () => {
  const {
    user,
    wallet,
    liveApi,
    addEvent,
    upsertSlab,
    openSlabDetail,
    showToast,
    reduceMotion,
    initialReplayError
  } = useApp();

  const [scanning, setScanning] = useState(false);
  const [rejected, setRejected] = useState(Boolean(initialReplayError));
  const [webNotice, setWebNotice] = useState<string | null>(null);
  const [replayError, setReplayError] = useState<string | null>(
    initialReplayError
  );

  const runVerification = async (
    input: DemoTriggerScenario | Awaited<ReturnType<typeof scanPhysicalNtag424>>
  ) => {
    setScanning(true);
    setRejected(false);
    setWebNotice(null);

    const startedAt = Date.now();
    const result = await verifyTap(input, {
      live: liveApi,
      clientAddress: wallet?.address || user?.walletAddress
    });

    const elapsed = Date.now() - startedAt;
    if (elapsed < 1300) {
      await new Promise((r) => setTimeout(r, 1300 - elapsed));
    }

    setScanning(false);

    if (result.usedFallback) {
      showToast('Couldn’t reach localhost:3000. Showing demo data.');
    }

    if (result.isError) {
      setRejected(true);
      setReplayError(result.message);
      addEvent({
        tone: 'rose',
        title: 'Replay attempt blocked',
        subtitle: result.message,
        time: 'Just now'
      });
      return;
    }

    const slab = result.data;
    upsertSlab(slab);

    addEvent({
      tone:
        slab.onChainState === 'SEALED'
          ? 'emerald'
          : slab.onChainState === 'IN_TRANSIT'
            ? 'amber'
            : 'slate',
      title: `${slab.short} scanned`,
      subtitle: `Counter #${slab.readCounter} matched the on-chain record`,
      time: 'Just now'
    });

    openSlabDetail(slab, true);
  };

  const handleStartScan = async () => {
    if (scanning) return;
    setRejected(false);
    setWebNotice(null);

    if (Platform.OS === 'web') {
      setScanning(true);
      await new Promise((r) => setTimeout(r, 2600));
      setScanning(false);
      setWebNotice(
        'No chip found. NFC needs the mobile app, so try a demo tap below.'
      );
      return;
    }

    try {
      setScanning(true);
      const payload = await scanPhysicalNtag424();
      await runVerification(payload);
    } catch (err) {
      setScanning(false);
      setWebNotice(
        err instanceof Error
          ? err.message
          : 'No chip found. Try a demo tap below.'
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 132,
        maxWidth: 1040,
        width: '100%',
        alignSelf: 'center',
        alignItems: 'center'
      }}
      style={{ flex: 1 }}
    >
      <View style={{ width: '100%', maxWidth: 520, alignItems: 'center' }}>
        {/* Radar shared with the Transfer screen */}
        <View style={{ marginBottom: 20 }}>
          <NfcRadar active={scanning} error={rejected} reduceMotion={reduceMotion} />
        </View>

        {/* Title & 4 cm guidance */}
        <Text
          style={[
            TYPE.h2,
            {
              color: COLORS.ink,
              textAlign: 'center'
            }
          ]}
        >
          Hold your phone near the chip
        </Text>
        <Text
          style={[
            TYPE.body,
            {
              color: COLORS.inkSecondary,
              textAlign: 'center',
              marginTop: 6,
              marginBottom: 18,
              maxWidth: 380
            }
          ]}
        >
          Keep the top of your phone within 4 cm of the label on the slab.
        </Text>

        {/* Scanning status or Start scan button */}
        {scanning ? (
          <View
            style={{
              width: '100%',
              backgroundColor: COLORS.yellowSoft,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 18,
              alignItems: 'center',
              marginBottom: 18
            }}
          >
            <Text style={[TYPE.button, { color: COLORS.ink }]}>
              Reading chip and checking the record…
            </Text>
          </View>
        ) : (
          <Button
            label="Start scan"
            variant="primary"
            icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
            onPress={handleStartScan}
            style={{ width: '100%', marginBottom: 18 }}
          />
        )}

        {/* Web / Hardware Amber Status Notice */}
        {webNotice && (
          <View
            style={{
              width: '100%',
              backgroundColor: COLORS.amberSoft,
              borderRadius: 16,
              padding: 14,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10
            }}
          >
            <Icon name="alert" size={20} color={COLORS.amberDark} />
            <Text
              style={[
                TYPE.smallSemiBold,
                {
                  flex: 1,
                  color: COLORS.amberDark
                }
              ]}
            >
              {webNotice}
            </Text>
          </View>
        )}

        {/* No chip nearby? Try a demo tap */}
        <View
          style={[
            CARD_SHADOW,
            {
              width: '100%',
              borderRadius: 20,
              padding: 20,
              marginTop: 4
            }
          ]}
        >
          <Text
            style={[
              TYPE.h3,
              {
                color: COLORS.ink,
                marginBottom: 12
              }
            ]}
          >
            No chip nearby? Try a demo tap
          </Text>

          {SCENARIOS.map((item) => (
            <TouchableOpacity
              key={item.scenario}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
              disabled={scanning}
              onPress={() => runVerification(item.scenario)}
              activeOpacity={0.82}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 14,
                minHeight: 62,
                borderRadius: 16,
                backgroundColor: COLORS.bg,
                borderWidth: 1,
                borderColor: COLORS.line,
                marginBottom: 10,
                opacity: scanning ? 0.55 : 1,
                gap: 12
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    TYPE.small,
                    {
                      color: COLORS.inkSecondary,
                      marginTop: 2
                    }
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Chip label={item.badge} tone={item.tone} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ReplayRejectedModal
        visible={Boolean(replayError)}
        errorMessage={replayError || ''}
        onClose={() => setReplayError(null)}
      />
    </ScrollView>
  );
};
