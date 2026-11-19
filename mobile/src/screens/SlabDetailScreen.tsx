import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { getReport } from '../api/report';
import { API_BASE_URL } from '../api/verify';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { MockCard } from '../components/MockCard';
import { CardInfoList } from '../components/report/CardInfoList';
import { CardViewer } from '../components/report/CardViewer';
import { CertDivider } from '../components/report/CertDivider';
import { DingsMap } from '../components/report/DingsMap';
import { DingsTable } from '../components/report/DingsTable';
import { GradeHeader } from '../components/report/GradeHeader';
import { CornerDetails, EdgeDetails } from '../components/report/RegionDetails';
import { SectionBar } from '../components/report/SectionBar';
import { SectionJumper } from '../components/report/SectionJumper';
import { ReportScrollContext, type ReportScrollApi } from '../components/report/shared';
import { SlabCaptures } from '../components/report/SlabCaptures';
import { StatTiles } from '../components/report/StatTiles';
import { SummaryTiles } from '../components/report/SummaryTiles';
import { SLABS } from '../data/demo';
import { useCountdown } from '../hooks/useCountdown';
import { useApp } from '../state/AppContext';
import {
  CARD_SHADOW,
  COLORS,
  formatCountdown,
  getGradeWord,
  getStateTone,
  sameAddress,
  truncateMiddle
} from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { claimCustodyWithWallet } from '../web3/wallet';

const PAD_X = 20;
const PAD_TOP = 16;
/** Matches TabBar: 74 high on phones; 76 high and floating 20 up on wide screens. */
const TAB_BAR_PHONE = 74;
const TAB_BAR_WIDE = 76 + 20;

type SectionKey = 'defects' | 'map' | 'corners' | 'edges' | 'captures' | 'onchain';

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
  const report = slab.report ?? getReport(slab.tokenId);

  const secondsLeft = useCountdown(slab.claimSignature.deadline * 1000, fresh);

  const isOwner = sameAddress(slab.ownerAddress, wallet?.address);
  const pendingTransfer = transfers.find(
    (t) => t.slabKey === slab.key && t.status === 'PENDING'
  );

  /* ---------------------------- scrolling ---------------------------- */

  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollY = useRef(0);
  const viewportH = useRef(0);
  const contentH = useRef(0);
  const listeners = useRef(new Set<() => void>());
  const sectionY = useRef<Partial<Record<SectionKey, number>>>({});
  const rowNodes = useRef(new Map<string, View>());
  const [jump, setJump] = useState({ up: false, down: true });
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const targets = () =>
    Object.values(sectionY.current)
      .filter((y): y is number => typeof y === 'number')
      .sort((a, b) => a - b);

  const refreshJump = useCallback(() => {
    const y = scrollY.current;
    const atBottom = y + viewportH.current >= contentH.current - 4;
    const next = {
      up: y > 4,
      down: !atBottom && targets().some((t) => t > y + 4)
    };
    setJump((j) => (j.up === next.up && j.down === next.down ? j : next));
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    viewportH.current = e.nativeEvent.layoutMeasurement.height;
    contentH.current = e.nativeEvent.contentSize.height;
    listeners.current.forEach((fn) => fn());
    refreshJump();
  };

  const scrollToY = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: !reduceMotion });
  }, [reduceMotion]);

  const scrollApi = useMemo<ReportScrollApi>(
    () => ({
      subscribe: (fn) => {
        listeners.current.add(fn);
        return () => {
          listeners.current.delete(fn);
        };
      },
      instant: reduceMotion || isComparisonDemo,
      scrollToY,
      contentRef
    }),
    [reduceMotion, isComparisonDemo, scrollToY]
  );

  const trackSection = (key: SectionKey) => (e: LayoutChangeEvent) => {
    // SectionBars are direct children of the content column, so this y is
    // already in scroll coordinates once the top padding is added.
    sectionY.current[key] = PAD_TOP + e.nativeEvent.layout.y;
    refreshJump();
  };

  const jumpUp = () => {
    const y = scrollY.current;
    const prev = targets().filter((t) => t < y - 4).pop();
    scrollToY(prev ?? 0);
  };

  const jumpDown = () => {
    const y = scrollY.current;
    const next = targets().find((t) => t > y + 4);
    if (next !== undefined) scrollToY(next);
  };

  const showDingInTable = (id: string) => {
    const node = rowNodes.current.get(id);
    setHighlightId(id);
    setTimeout(() => setHighlightId((h) => (h === id ? null : h)), 1600);
    if (!node || !contentRef.current) {
      scrollToY(sectionY.current.defects ?? 0);
      return;
    }
    node.measureLayout(
      contentRef.current as unknown as number,
      (_x, y) => scrollToY(PAD_TOP + y - 140),
      () => scrollToY(sectionY.current.defects ?? 0)
    );
  };

  const registerRow = useCallback((id: string, node: View | null) => {
    if (node) rowNodes.current.set(id, node);
    else rowNodes.current.delete(id);
  }, []);

  /* --------------------------- chain actions -------------------------- */

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

  /* ------------------------------ blocks ------------------------------ */

  const statusBanner = (
    <View
      style={{
        backgroundColor: toneSpec.bg,
        borderWidth: 1,
        borderColor: toneSpec.border,
        borderRadius: 20,
        padding: 16,
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
        <Text style={[TYPE.listItemTitle, { color: toneSpec.fg }]}>{toneSpec.label}</Text>
        <Text style={[TYPE.small, { color: COLORS.inkSecondary, marginTop: 3 }]}>
          {slab.stateNote ?? toneSpec.description}
        </Text>
      </View>
    </View>
  );

  const recordCard = (
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
              {secondsLeft === 0 ? 'Signature expired' : `Valid for ${formatCountdown(secondsLeft)}`}
            </Text>
          </View>
        ) : (
          <Text style={[TYPE.small, { color: COLORS.inkMuted }]}>Last checked {slab.checked}</Text>
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
  );

  const tabBarH = isWide ? TAB_BAR_WIDE : TAB_BAR_PHONE;
  const gradeWord = getGradeWord(slab.overallGrade);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={64}
        onLayout={(e) => {
          viewportH.current = e.nativeEvent.layout.height;
          refreshJump();
        }}
        onContentSizeChange={(_w, h) => {
          contentH.current = h;
          refreshJump();
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: PAD_X,
          paddingTop: PAD_TOP,
          // Nothing may sit under the tab bar.
          paddingBottom: tabBarH + 32
        }}
      >
        <ReportScrollContext.Provider value={scrollApi}>
          <View
            ref={contentRef}
            collapsable={false}
            style={{ width: '100%', maxWidth: isWide ? 720 : undefined, alignSelf: 'center' }}
          >
            {/* Top bar */}
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
              <Text style={[TYPE.h2, { color: COLORS.ink }]}>Grade report</Text>
              <View style={{ width: 44, height: 44 }} />
            </View>

            {statusBanner}

            {report ? (
              <>
                <GradeHeader grade={slab.overallGrade} report={report} />
                <CardInfoList
                  cardName={slab.cardName}
                  cardSet={slab.cardSet}
                  variation={slab.variation}
                />
                <StatTiles report={report} grade={slab.overallGrade} onInfo={showToast} />

                <CertDivider certId={slab.certId} />
                <CardViewer
                  slabKey={slab.key}
                  grade={slab.overallGrade}
                  dings={report.dings}
                  onInfo={showToast}
                />
                <SummaryTiles report={report} />

                <SectionBar
                  title="Defects identified"
                  bleed={PAD_X}
                  onLayout={trackSection('defects')}
                />
                <DingsTable
                  dings={report.dings}
                  highlightId={highlightId}
                  registerRow={registerRow}
                />

                <SectionBar title="Dings map" bleed={PAD_X} onLayout={trackSection('map')} />
                <DingsMap report={report} onDingPress={showDingInTable} />

                <SectionBar
                  title="Corner details"
                  bleed={PAD_X}
                  onLayout={trackSection('corners')}
                />
                <CornerDetails
                  slabKey={slab.key}
                  grade={slab.overallGrade}
                  scores={report.corners}
                />

                <SectionBar title="Edge details" bleed={PAD_X} onLayout={trackSection('edges')} />
                <EdgeDetails slabKey={slab.key} grade={slab.overallGrade} scores={report.edges} />

                <SectionBar
                  title="Slabbed image captures"
                  bleed={PAD_X}
                  onLayout={trackSection('captures')}
                />
                <SlabCaptures
                  slabKey={slab.key}
                  short={slab.short}
                  grade={slab.overallGrade}
                  gradeWord={gradeWord}
                  certId={slab.certId}
                />
              </>
            ) : (
              <>
                <CertDivider certId={slab.certId} />
                <View style={{ alignItems: 'center', gap: 16 }}>
                  <MockCard id={`detail_${slab.key}`} grade={slab.overallGrade} width={180} />
                  <Text style={[TYPE.body, { color: COLORS.muted, textAlign: 'center' }]}>
                    The detailed grade report for this slab is not available yet.
                  </Text>
                </View>
              </>
            )}

            <SectionBar
              title="On-chain record"
              bleed={PAD_X}
              onLayout={trackSection('onchain')}
            />
            {recordCard}
            {transferAction}
          </View>
        </ReportScrollContext.Provider>
      </ScrollView>

      {report && (
        <SectionJumper
          bottom={tabBarH + 16}
          right={16}
          canUp={jump.up}
          canDown={jump.down}
          onUp={jumpUp}
          onDown={jumpDown}
        />
      )}
    </View>
  );
};
