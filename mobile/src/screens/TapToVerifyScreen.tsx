import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import {
  buildDemoTapPayload,
  type ParsedSunUrl,
  scanPhysicalNtag424
} from '../nfc/sunReader';
import { readSlabFromChain } from '../web3/client';
import {
  CertificateInspectionView,
  type VerifiedCertificateData
} from '../components/CertificateInspectionView';
import {
  DevDemoBottomSheet,
  type DemoTriggerScenario
} from '../components/DevDemoBottomSheet';
import type { OnChainItemState } from '../abi/SlabRegistry';

declare const process: {
  env: Record<string, string | undefined>;
};

const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.EXPO_PUBLIC_API_BASE_URL) ||
  'http://localhost:3000';

// Fallback mock records used if offline / backend is unreachable during standalone UI preview
const OFFLINE_DEMO_FALLBACKS: Record<
  Exclude<DemoTriggerScenario, 'REPLAY_ATTACK'>,
  VerifiedCertificateData
> = {
  VALID_CHARIZARD_SEALED: {
    verified: true,
    tagUid: '04A1B2C3D4E501',
    readCounter: 11,
    tokenId: 1,
    certId: 'CERT-PKMN-2026-0001',
    cardName: '1st Edition Shadowless Holo Charizard #4',
    cardSet: '1999 Pokemon Base Set',
    overallGrade: 10.0,
    subGrades: { centering: 10.0, surface: 10.0, corners: 10.0, edges: 10.0 },
    ipfsMetadataCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    onChainState: 'SEALED',
    claimSignature: {
      r: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      s: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
      v: 27,
      signature:
        '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b4c5d',
      deadline: Math.floor(Date.now() / 1000) + 120
    }
  },
  VALID_PIKACHU_SEALED: {
    verified: true,
    tagUid: '04A1B2C3D4E502',
    readCounter: 21,
    tokenId: 2,
    certId: 'CERT-PKMN-2026-0002',
    cardName: '1st Edition Shadowless Pikachu #58',
    cardSet: '1999 Pokemon Base Set',
    overallGrade: 9.5,
    subGrades: { centering: 9.5, surface: 9.5, corners: 10.0, edges: 9.0 },
    ipfsMetadataCid: 'QmZtmD2qtQgVPekm8a6ZububQ5D63Gzh9WAK7WeqBmyxyg',
    onChainState: 'SEALED',
    claimSignature: {
      r: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      s: '0xffeeddccbbaa00998877665544332211ffeeddccbbaa00998877665544332211',
      v: 28,
      signature:
        '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      deadline: Math.floor(Date.now() / 1000) + 120
    }
  }
};

export const TapToVerifyScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [certificate, setCertificate] =
    useState<VerifiedCertificateData | null>(null);

  const verifyPayloadWithBackendAndChain = async (
    payload: ParsedSunUrl,
    demoScenario?: DemoTriggerScenario
  ) => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/nfc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piccData: payload.piccData,
          cmac: payload.cmac,
          clientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
        })
      });

      const json = (await response.json()) as {
        success: boolean;
        data?: VerifiedCertificateData;
        error?: { code: string; message: string };
      };

      if (!response.ok || !json.success || !json.data) {
        setCertificate(null);
        setErrorBanner({
          code: json.error?.code || 'ERR_VERIFICATION_REJECTED',
          message:
            json.error?.message ||
            'Cryptographic CMAC or monotonic read counter verification failed.'
        });
        return;
      }

      const relayData = json.data;

      // Query Polygon / local Anvil contract directly via viem to confirm on-chain state
      const onChainRecord = await readSlabFromChain(
        relayData.tokenId,
        relayData.onChainState as OnChainItemState
      );

      setCertificate({
        ...relayData,
        onChainState: onChainRecord?.currentState ?? relayData.onChainState,
        ownerAddress: onChainRecord?.owner,
        issuerAddress: onChainRecord?.issuer
      });
    } catch {
      // If backend server is not yet started, still render deterministic demo scenarios seamlessly
      if (demoScenario === 'REPLAY_ATTACK') {
        setCertificate(null);
        setErrorBanner({
          code: 'ERR_REPLAY_ATTACK',
          message:
            'Read counter 1 is less than or equal to last authenticated counter (5). Static clone / replay rejected.'
        });
      } else if (demoScenario) {
        const fallback = OFFLINE_DEMO_FALLBACKS[demoScenario];
        const onChainRecord = await readSlabFromChain(
          fallback.tokenId,
          fallback.onChainState
        );
        setCertificate({
          ...fallback,
          onChainState: onChainRecord?.currentState ?? fallback.onChainState
        });
      } else {
        setErrorBanner({
          code: 'ERR_NETWORK_UNREACHABLE',
          message: `Could not reach Cryptographic Relay at ${API_BASE_URL}.`
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhysicalTap = async () => {
    setErrorBanner(null);
    try {
      const sunPayload = await scanPhysicalNtag424();
      await verifyPayloadWithBackendAndChain(sunPayload);
    } catch (err) {
      setErrorBanner({
        code: 'ERR_NFC_HARDWARE',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to initiate physical NFC scan.'
      });
    }
  };

  const handleDemoScenario = async (scenario: DemoTriggerScenario) => {
    const sunPayload = buildDemoTapPayload(scenario);
    await verifyPayloadWithBackendAndChain(sunPayload, scenario);
  };

  return (
    <View
      className="flex-1 bg-slate-950 justify-between px-4 pt-12"
      style={{
        flex: 1,
        backgroundColor: '#020617',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 32
      }}
    >
      {/* Header & Core Tap-to-Verify Action */}
      <View className="items-center" style={{ alignItems: 'center' }}>
        <View
          className="flex-row items-center space-x-2 mb-1"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4
          }}
        >
          <View
            className="w-2.5 h-2.5 rounded-full bg-emerald-400"
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: '#34d399'
            }}
          />
          <Text
            className="text-white text-xl font-black tracking-tight"
            style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '900',
              letterSpacing: 0.5
            }}
          >
            SLABLOCK PROTOCOL
          </Text>
        </View>
        <Text
          className="text-slate-400 text-xs text-center mb-4"
          style={{
            color: '#94a3b8',
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 16
          }}
        >
          NTAG 424 DNA Dynamic SUN • Polygon PoS Digital Twin Verifier
        </Text>

        <TouchableOpacity
          disabled={isLoading}
          onPress={handlePhysicalTap}
          className="w-full bg-indigo-600 border border-indigo-400 rounded-2xl py-4 px-6 items-center shadow-lg"
          style={{
            width: '100%',
            backgroundColor: '#4f46e5',
            borderWidth: 1,
            borderColor: '#818cf8',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: 'center'
          }}
        >
          {isLoading ? (
            <View
              className="flex-row items-center space-x-2"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <ActivityIndicator color="#ffffff" size="small" />
              <Text
                className="text-white font-bold text-sm ml-2"
                style={{ color: '#ffffff', fontWeight: '700', fontSize: 14, marginLeft: 8 }}
              >
                Decrypting AES-128 SUN & Querying Polygon...
              </Text>
            </View>
          ) : (
            <>
              <Text
                className="text-white font-extrabold text-base"
                style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}
              >
                📡 Tap Physical Slab (NFC ISO-14443-4)
              </Text>
              <Text
                className="text-indigo-200 text-xs mt-1"
                style={{ color: '#c7d2fe', fontSize: 12, marginTop: 4 }}
              >
                Hold phone within 4cm of embedded NTAG 424 DNA seal
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Error / Replay Attack Alert Banner */}
      {errorBanner && (
        <View
          className="w-full bg-red-950 border-2 border-red-500 rounded-2xl p-4 mt-4"
          style={{
            width: '100%',
            backgroundColor: '#450a0a',
            borderWidth: 2,
            borderColor: '#ef4444',
            borderRadius: 16,
            padding: 16,
            marginTop: 16
          }}
        >
          <Text
            className="text-red-400 text-xs font-black uppercase tracking-widest"
            style={{
              color: '#f87171',
              fontSize: 12,
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            🚨 SECURITY REJECTION: {errorBanner.code}
          </Text>
          <Text
            className="text-white text-sm font-bold mt-1"
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '700',
              marginTop: 6
            }}
          >
            {errorBanner.message}
          </Text>
          <Text
            className="text-red-300 text-xs mt-2"
            style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}
          >
            Dynamic AES-128 CMAC counter validation blocked a suspected cloned NFC tag or replayed URL.
          </Text>
        </View>
      )}

      {/* Certificate Inspection View */}
      {certificate && <CertificateInspectionView certificate={certificate} />}

      {/* Visible Dev Demo Mode Bottom Sheet with 3 Quick-Trigger Buttons */}
      <DevDemoBottomSheet
        onSelectScenario={handleDemoScenario}
        isLoading={isLoading}
      />
    </View>
  );
};
