import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { buildSimulatedRecipientTap, TRANSFER_WINDOW_SECONDS } from '../api/transfer';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { MockCard } from '../components/MockCard';
import { NfcRadar } from '../components/NfcRadar';
import { Ring } from '../components/Ring';
import { DEMO_RECIPIENT } from '../data/demo';
import { useCountdown } from '../hooks/useCountdown';
import { scanPhysicalNtag424 } from '../nfc/sunReader';
import { useApp } from '../state/AppContext';
import {
  CARD_SHADOW,
  COLORS,
  formatCountdown,
  sameAddress,
  truncateMiddle
} from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const TransferScreen: React.FC = () => {
  const {
    transferSlabKey,
    lastScan,
    findSlab,
    transfers,
    beginTransfer,
    completeTransfer,
    cancelPendingTransfer,
    openSlabDetail,
    navigate,
    showToast,
    reduceMotion,
    demoMode,
    wallet
  } = useApp();

  const slab =
    (transferSlabKey ? findSlab(transferSlabKey) : undefined) ?? lastScan?.slab;

  const [recipient, setRecipient] = useState<string>(DEMO_RECIPIENT);
  const [busy, setBusy] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Latest transfer for this slab (pending, or the most recent outcome).
  const transfer = slab
    ? [...transfers]
        .filter((t) => t.slabKey === slab.key)
        .sort((a, b) => b.startedAt - a.startedAt)[0]
    : undefined;
  const pending = transfer?.status === 'PENDING' ? transfer : undefined;

  const secondsLeft = useCountdown(pending?.deadline ?? 0, Boolean(pending));
  const nfcAvailable = Platform.OS !== 'web';

  if (!slab) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={[TYPE.bodyMedium, { color: COLORS.inkSecondary, marginBottom: 16 }]}>
          Pick a slab from your collection to transfer it.
        </Text>
        <Button label="Go to collection" onPress={() => navigate('Collection')} />
      </View>
    );
  }

  const owner = slab.ownerAddress || '';
  const isOwner = sameAddress(owner, wallet?.address);
  const recipientValid = ADDRESS_RE.test(recipient.trim());
  const recipientIsOwner = sameAddress(recipient.trim(), owner);

  const handleStart = async () => {
    setError(null);
    if (!recipientValid) {
      setError('Enter a full wallet address (0x followed by 40 hex characters).');
      return;
    }
    if (recipientIsOwner) {
      setError('The recipient must be a different wallet from the current owner.');
      return;
    }
    setBusy(true);
    try {
      await beginTransfer(slab, recipient.trim());
      showToast(`Transfer started. ${TRANSFER_WINDOW_SECONDS} s to tap.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the transfer.');
    } finally {
      setBusy(false);
    }
  };

  const confirmWith = async (payload: Parameters<typeof completeTransfer>[1]) => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await completeTransfer(pending.id, payload);
      showToast('Transfer completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipient tap failed.');
    } finally {
      setBusy(false);
      setListening(false);
    }
  };

  const handleRealTap = async () => {
    if (!pending) return;
    setListening(true);
    setError(null);
    try {
      const payload = await scanPhysicalNtag424();
      await confirmWith(payload);
    } catch (err) {
      setListening(false);
      setError(err instanceof Error ? err.message : 'No chip found.');
    }
  };

  const handleCancel = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await cancelPendingTransfer(pending.id);
      showToast('Transfer cancelled');
    } finally {
      setBusy(false);
    }
  };

  const outcome:
    | { title: string; body: string; icon: IconName; fg: string; bg: string; border: string }
    | null =
    !pending && transfer
      ? transfer.status === 'COMPLETED'
        ? {
            title: 'Transfer completed',
            body: `${slab.short} now belongs to ${truncateMiddle(transfer.to, 6, 4)}.`,
            icon: 'check',
            fg: COLORS.emeraldDark,
            bg: COLORS.emeraldSoft,
            border: COLORS.emeraldBorder
          }
        : transfer.status === 'EXPIRED'
          ? {
              title: 'Transfer expired',
              body: `${truncateMiddle(transfer.to, 6, 4)} did not tap within ${TRANSFER_WINDOW_SECONDS} s. The slab stays with ${truncateMiddle(transfer.from, 6, 4)}.`,
              icon: 'alert',
              fg: COLORS.roseDark,
              bg: COLORS.roseSoft,
              border: COLORS.roseBorder
            }
          : {
              title: 'Transfer cancelled',
              body: `The slab stays with ${truncateMiddle(transfer.from, 6, 4)}.`,
              icon: 'close',
              fg: COLORS.inkSecondary,
              bg: COLORS.bgSoft,
              border: COLORS.line
            }
      : null;

  const canStartNew = !pending && isOwner && slab.onChainState === 'SEALED';

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 132,
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center'
      }}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to slab"
          onPress={() => openSlabDetail(slab, false)}
          style={[
            CARD_SHADOW,
            { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
          ]}
        >
          <Icon name="back" size={20} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={[TYPE.h2, { color: COLORS.ink }]}>Transfer ownership</Text>
        <View style={{ width: 44, height: 44 }} />
      </View>

      {/* Slab summary */}
      <View
        style={[
          CARD_SHADOW,
          { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }
        ]}
      >
        <MockCard id={`transfer_${slab.key}`} grade={slab.overallGrade} width={56} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
            {slab.short}
          </Text>
          <Text numberOfLines={1} style={[TYPE.small, { color: COLORS.inkSecondary }]}>
            {slab.cardSet}
          </Text>
          <Text
            style={{
              fontFamily: FONT_FAMILIES.lexendSemiBold,
              fontSize: 10,
              letterSpacing: 1.1,
              color: COLORS.inkMuted,
              marginTop: 8
            }}
          >
            CURRENT OWNER
          </Text>
          <Text style={[TYPE.mono, { color: COLORS.ink }]}>{truncateMiddle(owner, 6, 4)}</Text>
        </View>
      </View>

      {pending ? (
        <View style={[CARD_SHADOW, { borderRadius: 20, padding: 20, alignItems: 'center' }]}>
          <NfcRadar active reduceMotion={reduceMotion} />

          <Text style={[TYPE.h3, { color: COLORS.ink, textAlign: 'center', marginTop: 8 }]}>
            Ask the recipient to tap their phone on the slab
          </Text>
          <Text
            style={[TYPE.small, { color: COLORS.inkSecondary, textAlign: 'center', marginTop: 6 }]}
          >
            Sending to <Text style={TYPE.mono}>{truncateMiddle(pending.to, 6, 4)}</Text>
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 18 }}>
            <Ring
              progress={(secondsLeft / TRANSFER_WINDOW_SECONDS) * 100}
              size={64}
              strokeWidth={6}
              color={secondsLeft <= 20 ? COLORS.rose : COLORS.amber}
              trackColor={COLORS.amberSoft}
              label={formatCountdown(secondsLeft)}
              labelSize={13}
            />
            <View>
              <Text style={[TYPE.listItemTitle, { color: COLORS.amberDark }]}>
                Awaiting recipient tap
              </Text>
              <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
                The slab is in transit until they tap.
              </Text>
            </View>
          </View>

          {nfcAvailable && (
            <Button
              label={listening ? 'Hold the phone to the slab…' : 'Read recipient tap'}
              variant="primary"
              icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
              onPress={handleRealTap}
              disabled={busy || listening}
              style={{ width: '100%', marginBottom: 10 }}
            />
          )}

          {!nfcAvailable && demoMode && (
            <Button
              label="Simulate recipient tap"
              variant="primary"
              icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
              loading={busy}
              onPress={() => confirmWith(buildSimulatedRecipientTap(slab.tagUid))}
              style={{ width: '100%', marginBottom: 10 }}
            />
          )}

          {!nfcAvailable && !demoMode && (
            <Text
              style={[TYPE.small, { color: COLORS.inkSecondary, textAlign: 'center', marginBottom: 12 }]}
            >
              The recipient taps with the SlabLock mobile app. NFC is not available in the browser.
            </Text>
          )}

          <Button
            label="Cancel transfer"
            variant="outline"
            icon={<Icon name="close" size={16} color={COLORS.ink} />}
            onPress={handleCancel}
            disabled={busy}
            style={{ width: '100%' }}
          />
        </View>
      ) : (
        <>
          {outcome && (
            <View
              style={{
                backgroundColor: outcome.bg,
                borderWidth: 1,
                borderColor: outcome.border,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                gap: 12
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: COLORS.bgElevated,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name={outcome.icon} size={20} color={outcome.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.listItemTitle, { color: outcome.fg }]}>{outcome.title}</Text>
                <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 3 }]}>
                  {outcome.body}
                </Text>
              </View>
            </View>
          )}

          {canStartNew ? (
            <View style={[CARD_SHADOW, { borderRadius: 20, padding: 20 }]}>
              <Text style={[TYPE.smallSemiBold, { color: COLORS.ink, marginBottom: 8 }]}>
                Recipient wallet
              </Text>
              <TextInput
                accessibilityLabel="Recipient wallet"
                value={recipient}
                onChangeText={(v) => {
                  setRecipient(v);
                  setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="0x…"
                placeholderTextColor={COLORS.inkMuted}
                style={[
                  TYPE.mono,
                  {
                    color: COLORS.ink,
                    backgroundColor: COLORS.bg,
                    borderWidth: 1,
                    borderColor: error ? COLORS.rose : COLORS.line,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    minHeight: 48
                  }
                ]}
              />
              <Text style={[TYPE.small, { color: COLORS.inkMuted, marginTop: 8 }]}>
                The recipient has {TRANSFER_WINDOW_SECONDS} s to tap the slab with their phone. Until then it shows as in transit.
              </Text>

              {error && (
                <Text style={[TYPE.smallSemiBold, { color: COLORS.roseDark, marginTop: 10 }]}>
                  {error}
                </Text>
              )}

              <Button
                label="Start transfer"
                variant="primary"
                icon={<Icon name="chain" size={18} color={COLORS.onAccent} />}
                loading={busy}
                onPress={handleStart}
                style={{ width: '100%', marginTop: 16 }}
              />
            </View>
          ) : (
            <Button
              label="Back to slab"
              variant="outline"
              onPress={() => openSlabDetail(slab, false)}
              style={{ width: '100%' }}
            />
          )}
        </>
      )}

      {pending && error && (
        <Text style={[TYPE.smallSemiBold, { color: COLORS.roseDark, marginTop: 12, textAlign: 'center' }]}>
          {error}
        </Text>
      )}
    </ScrollView>
  );
};
