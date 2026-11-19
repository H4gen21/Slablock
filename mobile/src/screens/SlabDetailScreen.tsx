import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { API_BASE_URL } from '../api/verify';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { ImperfectionsSection } from '../components/MacroLoupe';
import { MockCard } from '../components/MockCard';
import { SLABS } from '../data/demo';
import { useCountdown } from '../hooks/useCountdown';
import { useApp } from '../state/AppContext';
import {
  CARD_SHADOW,
  COLORS,
  formatCountdown,
  formatGradedDate,
  getGradeWord,
  getStateTone,
  sameAddress,
  truncateMiddle
} from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';
import { claimCustodyWithWallet } from '../web3/wallet';

export const SlabDetailScreen: React.FC = () => {
  const {
    lastScan,
    findSlab,
    navigate,
    showToast,
    reduceMotion,
    wallet,
    openWalletModal,
    upsertSlab,
    openSlabDetail,
    addEvent,
    viewportMode,
    isComparisonDemo,
    transfers,
    openTransfer
  } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 900 && viewportMode !== 'mobile';
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimedTxHash, setClaimedTxHash] = useState<string | null>(null);

  // Read the live copy so transfers and expiries show up immediately.
  const slab =
    (lastScan ? findSlab(lastScan.slab.key) : undefined) ??
    lastScan?.slab ??
    SLABS[0];
  const fresh = lastScan?.fresh ?? false;
  const toneSpec = getStateTone(slab.onChainState);
  const graded = formatGradedDate(slab.gradedAt);

  const secondsLeft = useCountdown(slab.claimSignature.deadline * 1000, fresh);

  const isOwner = sameAddress(slab.ownerAddress, wallet?.address);
  const pendingTransfer = transfers.find(
    (t) => t.slabKey === slab.key && t.status === 'PENDING'
  );

  const barAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      barAnim.setValue(1);
      return;
    }
    barAnim.setValue(0);
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 550,
      useNativeDriver: false
    }).start();
  }, [slab.key, reduceMotion, barAnim]);

  const handleCopy = async (label: string, value: string) => {
    try {
      await Clipboard.setStringAsync(value);
    } finally {
      showToast(`Copied ${label}`);
    }
  };

  const handleClaimCustody = async () => {
    if (!wallet) {
      openWalletModal();
      return;
    }
    if (claiming || secondsLeft <= 0) return;
    setClaiming(true);
    try {
      const result = await claimCustodyWithWallet({
        tokenId: slab.tokenId,
        certId: slab.certId,
        tagUid: slab.tagUid,
        claimSignature: slab.claimSignature,
        wallet,
        apiBaseUrl: API_BASE_URL
      });
      const updated = {
        ...slab,
        ownerAddress: result.newOwner,
        onChainState: 'SEALED' as const,
        stateNote: `Custody claimed by ${truncateMiddle(result.newOwner, 6, 4)}.`
      };
      upsertSlab(updated);
      openSlabDetail(updated, true);
      setClaimedTxHash(result.txHash);
      addEvent({
        tone: 'emerald',
        title: `Custody claimed • ${slab.short}`,
        subtitle: `Owner ${truncateMiddle(result.newOwner, 6, 4)} • Receipt ${truncateMiddle(result.txHash, 8, 6)}`,
        time: 'Just now'
      });
      showToast(`Custody claimed by ${truncateMiddle(result.newOwner, 6, 4)}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to claim custody');
    } finally {
      setClaiming(false);
    }
  };

  const subGradeEntries: Array<{ label: string; value: number }> = [
    { label: 'Centering', value: slab.subGrades.centering },
    { label: 'Corners', value: slab.subGrades.corners },
    { label: 'Edges', value: slab.subGrades.edges },
    { label: 'Surface', value: slab.subGrades.surface }
  ];

  const ownerAddress = slab.ownerAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const issuerAddress = slab.issuerAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const recordRows: Array<{
    label: string;
    value: string;
    display: string;
    copyable?: boolean;
  }> = [
    { label: 'Tag UID', value: slab.tagUid, display: slab.tagUid, copyable: true },
    { label: 'Read counter', value: String(slab.readCounter), display: `#${slab.readCounter}` },
    { label: 'Token ID', value: String(slab.tokenId), display: `#${slab.tokenId}` },
    { label: 'Certificate', value: slab.certId, display: slab.certId, copyable: true },
    {
      label: 'Metadata',
      value: `ipfs://${slab.ipfsMetadataCid}`,
      display: truncateMiddle(`ipfs://${slab.ipfsMetadataCid}`, 11, 6),
      copyable: true
    },
    { label: 'Owner', value: ownerAddress, display: truncateMiddle(ownerAddress, 6, 4), copyable: true },
    {
      label: 'Grading authority',
      value: issuerAddress,
      display: truncateMiddle(issuerAddress, 6, 4),
      copyable: true
    }
  ];

  if (fresh) {
    recordRows.push({
      label: 'Claim signature',
      value: slab.claimSignature.signature,
      display: truncateMiddle(slab.claimSignature.signature, 10, 6),
      copyable: true
    });
  }

  const bannerIcon: IconName =
    slab.onChainState === 'SEALED'
      ? 'shield'
      : slab.onChainState === 'IN_TRANSIT'
        ? 'chain'
        : 'alert';

  const transferAction =
    isOwner && (slab.onChainState === 'SEALED' || pendingTransfer) ? (
      <Button
        label={pendingTransfer ? 'View transfer' : 'Transfer ownership'}
        variant="primary"
        icon={<Icon name="chain" size={18} color={COLORS.onAccent} />}
        onPress={() => openTransfer(slab.key)}
        style={{ width: '100%', marginBottom: 16 }}
      />
    ) : null;

  const leftColumn = (
    <View style={{ width: isWide ? 340 : '100%' }}>
      {/* Status banner: state name only, body is the state description. */}
      <View
        style={{
          backgroundColor: toneSpec.bg,
          borderWidth: 1,
          borderColor: toneSpec.border,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
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
          <Icon name={bannerIcon} size={20} color={toneSpec.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.listItemTitle, { color: toneSpec.fg }]}>
            {toneSpec.label}
          </Text>
          <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 3 }]}>
            {slab.stateNote ?? toneSpec.description}
          </Text>
        </View>
      </View>

      {/* Slab visual: label row and the mock card (no artwork). */}
      <View style={[CARD_SHADOW, { borderRadius: 20, padding: 16, marginBottom: 16 }]}>
        <View
          style={{
            backgroundColor: COLORS.yellowSoft,
            borderRadius: 14,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text numberOfLines={1} style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
              {slab.short}
            </Text>
            <Text
              numberOfLines={1}
              style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 2 }]}
            >
              {slab.certId}
            </Text>
          </View>
          <Text
            style={{
              color: COLORS.yellowDeep,
              fontSize: 22,
              fontFamily: FONT_FAMILIES.lexendBold
            }}
          >
            {slab.overallGrade.toFixed(1)}
          </Text>
        </View>

        <View
          style={{
            alignItems: 'center',
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: COLORS.bg,
            marginBottom: 12
          }}
        >
          <MockCard id={`detail_${slab.key}`} grade={slab.overallGrade} width={150} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: toneSpec.accent
              }}
            />
            <Text style={[TYPE.smallSemiBold, { color: COLORS.inkSecondary }]}>
              NTAG 424 DNA chip
            </Text>
          </View>
          <Text style={[TYPE.small, { color: COLORS.inkMuted }]}>{toneSpec.label}</Text>
        </View>
      </View>

      {transferAction}
    </View>
  );

  const rightColumn = (
    <View style={{ flex: isWide ? 1 : undefined }}>
      {/* Grade card */}
      <View style={[CARD_SHADOW, { borderRadius: 20, padding: 20, marginBottom: 16 }]}>
        <Text style={[TYPE.h2, { color: COLORS.ink }]}>{slab.cardName}</Text>
        <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 2 }]}>
          {slab.cardSet}
        </Text>
        {graded ? (
          <Text style={[TYPE.small, { color: COLORS.inkMuted, marginTop: 2 }]}>
            Graded {graded}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginTop: 16,
            marginBottom: 18
          }}
        >
          <Text style={[TYPE.gradeNumber, { color: COLORS.yellowDeep }]}>
            {slab.overallGrade.toFixed(1)}
          </Text>
          <View>
            <Text style={[TYPE.h3, { color: COLORS.ink }]}>
              {getGradeWord(slab.overallGrade)}
            </Text>
            <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 2 }]}>
              Overall grade
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {subGradeEntries.map((sub) => {
            const pct = (sub.value / 10) * 100;
            return (
              <View
                key={sub.label}
                style={{
                  width: '48%',
                  flexGrow: 1,
                  backgroundColor: COLORS.bg,
                  borderWidth: 1,
                  borderColor: COLORS.line,
                  borderRadius: 14,
                  padding: 12
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}
                >
                  <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>
                    {sub.label}
                  </Text>
                  <Text style={[TYPE.subGradeValue, { color: COLORS.yellowDeep }]}>
                    {sub.value.toFixed(1)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: COLORS.yellowSoft,
                    overflow: 'hidden'
                  }}
                >
                  <Animated.View
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: COLORS.yellowDeep,
                      width: barAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${pct}%`]
                      })
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <ImperfectionsSection slab={slab} />

      {/* Chip and on-chain record */}
      <View style={[CARD_SHADOW, { borderRadius: 20, padding: 20, marginBottom: 16 }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 8
          }}
        >
          <Text style={[TYPE.sectionHeading, { color: COLORS.ink, flexShrink: 1 }]}>
            Chip and on-chain record
          </Text>

          {fresh ? (
            <View
              style={{
                backgroundColor:
                  secondsLeft === 0
                    ? COLORS.roseSoft
                    : secondsLeft <= 20
                      ? COLORS.amberSoft
                      : COLORS.emeraldSoft,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5
              }}
            >
              <Text
                style={[
                  TYPE.chip,
                  {
                    color:
                      secondsLeft === 0
                        ? COLORS.roseDark
                        : secondsLeft <= 20
                          ? COLORS.amberDark
                          : COLORS.emeraldDark
                  }
                ]}
              >
                {secondsLeft === 0
                  ? 'Signature expired'
                  : `Valid for ${formatCountdown(secondsLeft)}`}
              </Text>
            </View>
          ) : (
            <Text style={[TYPE.small, { color: COLORS.inkMuted }]}>
              Last checked {slab.checked}
            </Text>
          )}
        </View>

        {recordRows.map((row, idx) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: COLORS.line
            }}
          >
            <Text style={[TYPE.small, { color: COLORS.inkSecondary }]}>{row.label}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[TYPE.mono, { color: COLORS.ink }]}>{row.display}</Text>
              {row.copyable && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Copy ${row.label}`}
                  onPress={() => handleCopy(row.label, row.value)}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    backgroundColor: COLORS.yellowSoft
                  }}
                >
                  <Icon name="copy" size={15} color={COLORS.ink} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {!fresh && (
          <View style={{ marginTop: 14 }}>
            <Button
              label="Scan this slab again"
              variant="primary"
              icon={<Icon name="nfc" size={18} color={COLORS.onAccent} />}
              onPress={() => navigate('Scan')}
              style={{ width: '100%' }}
            />
          </View>
        )}

        {fresh && !isComparisonDemo && !isOwner && slab.onChainState === 'SEALED' && (
          <View style={{ marginTop: 14 }}>
            <Button
              label={
                claiming
                  ? 'Signing EIP-712 custody claim…'
                  : claimedTxHash
                    ? `Custody claimed (${truncateMiddle(claimedTxHash, 8, 6)})`
                    : wallet
                      ? `Claim custody with ${truncateMiddle(wallet.address, 6, 4)}`
                      : 'Connect wallet to claim custody'
              }
              variant="primary"
              icon={<Icon name="shield" size={18} color={COLORS.onAccent} />}
              onPress={handleClaimCustody}
              disabled={claiming || secondsLeft === 0}
              style={{ width: '100%' }}
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 132,
        maxWidth: 1040,
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
          accessibilityLabel="Back"
          onPress={() => navigate('Home')}
          style={[
            CARD_SHADOW,
            {
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center'
            }
          ]}
        >
          <Icon name="back" size={20} color={COLORS.ink} />
        </TouchableOpacity>

        <Text style={[TYPE.h2, { color: COLORS.ink }]}>Slab details</Text>

        <View style={{ width: 44, height: 44 }} />
      </View>

      {isWide ? (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          {leftColumn}
          {rightColumn}
        </View>
      ) : (
        <>
          {leftColumn}
          {rightColumn}
        </>
      )}
    </ScrollView>
  );
};
