import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { OnChainItemState } from '../abi/SlabRegistry';

export interface VerifiedCertificateData {
  verified: boolean;
  tagUid: string;
  readCounter: number;
  tokenId: number;
  certId: string;
  cardName: string;
  cardSet: string;
  overallGrade: number;
  subGrades: {
    centering: number;
    surface: number;
    corners: number;
    edges: number;
  };
  ipfsMetadataCid: string;
  onChainState: OnChainItemState;
  ownerAddress?: string;
  issuerAddress?: string;
  claimSignature: {
    r: string;
    s: string;
    v: number;
    signature: string;
    deadline: number;
  };
}

interface CertificateInspectionViewProps {
  certificate: VerifiedCertificateData;
}

export const CertificateInspectionView: React.FC<CertificateInspectionViewProps> = ({
  certificate
}) => {
  const isSealed = certificate.onChainState === 'SEALED';

  return (
    <ScrollView
      className="w-full mt-4 rounded-2xl bg-slate-900 border border-slate-800 p-4"
      style={{
        width: '100%',
        marginTop: 16,
        borderRadius: 16,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        padding: 16
      }}
    >
      {/* Status Banner: green for SEALED, amber for any other state */}
      <View
        className={`w-full rounded-xl p-4 mb-4 border ${
          isSealed
            ? 'bg-emerald-950/80 border-emerald-500'
            : 'bg-amber-950/80 border-amber-500'
        }`}
        style={{
          width: '100%',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1.5,
          backgroundColor: isSealed
            ? 'rgba(6, 78, 59, 0.55)'
            : 'rgba(69, 26, 3, 0.6)',
          borderColor: isSealed ? '#10b981' : '#f59e0b'
        }}
      >
        <View
          className="flex-row items-center justify-between"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Text
            className={`text-xs font-bold uppercase tracking-widest ${
              isSealed ? 'text-emerald-400' : 'text-red-400'
            }`}
            style={{
              fontSize: 12,
              fontWeight: '800',
              letterSpacing: 1,
              color: isSealed ? '#34d399' : '#f87171'
            }}
          >
            {isSealed
              ? 'SEALED'
              : certificate.onChainState === 'IN_TRANSIT'
                ? 'IN TRANSIT'
                : 'NOT SEALED'}
          </Text>
          <View
            className={`px-2.5 py-1 rounded-full ${
              isSealed ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isSealed
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(239, 68, 68, 0.25)'
            }}
          >
            <Text
              className={`text-xs font-extrabold ${
                isSealed ? 'text-emerald-300' : 'text-red-300'
              }`}
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: isSealed ? '#6ee7b7' : '#fca5a5'
              }}
            >
              {certificate.onChainState}
            </Text>
          </View>
        </View>

        <Text
          className="text-white text-lg font-extrabold mt-2"
          style={{
            color: '#ffffff',
            fontSize: 18,
            fontWeight: '800',
            marginTop: 8
          }}
        >
          {certificate.cardName}
        </Text>
        <Text
          className="text-slate-300 text-xs mt-0.5"
          style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}
        >
          {certificate.cardSet} • Cert #{certificate.certId}
        </Text>

      </View>

      {/* Overall Grade + 4 Sub-Grades Matrix */}
      <View
        className="flex-row items-center justify-between bg-slate-950 rounded-xl p-3.5 mb-4 border border-slate-800"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e293b'
        }}
      >
        <View
          className="pr-4 border-r border-slate-800"
          style={{
            paddingRight: 16,
            borderRightWidth: 1,
            borderRightColor: '#1e293b'
          }}
        >
          <Text
            className="text-slate-400 text-[10px] uppercase font-bold"
            style={{
              color: '#94a3b8',
              fontSize: 10,
              textTransform: 'uppercase',
              fontWeight: '700'
            }}
          >
            SlabLock Grade
          </Text>
          <Text
            className="text-amber-400 text-3xl font-black mt-0.5"
            style={{
              color: '#fbbf24',
              fontSize: 28,
              fontWeight: '900',
              marginTop: 2
            }}
          >
            {certificate.overallGrade.toFixed(1)}
          </Text>
          <Text
            className="text-slate-400 text-[10px]"
            style={{ color: '#94a3b8', fontSize: 10 }}
          >
            {certificate.overallGrade >= 10 ? 'GEM MINT' : 'MINT'}
          </Text>
        </View>

        <View className="flex-1 pl-4" style={{ flex: 1, paddingLeft: 16 }}>
          <View
            className="flex-row justify-between mb-1.5"
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 6
            }}
          >
            <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
              Centering:{' '}
              <Text className="text-white font-bold" style={{ color: '#ffffff', fontWeight: '700' }}>
                {certificate.subGrades.centering.toFixed(1)}
              </Text>
            </Text>
            <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
              Corners:{' '}
              <Text className="text-white font-bold" style={{ color: '#ffffff', fontWeight: '700' }}>
                {certificate.subGrades.corners.toFixed(1)}
              </Text>
            </Text>
          </View>
          <View
            className="flex-row justify-between"
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
              Edges:{' '}
              <Text className="text-white font-bold" style={{ color: '#ffffff', fontWeight: '700' }}>
                {certificate.subGrades.edges.toFixed(1)}
              </Text>
            </Text>
            <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
              Surface:{' '}
              <Text className="text-white font-bold" style={{ color: '#ffffff', fontWeight: '700' }}>
                {certificate.subGrades.surface.toFixed(1)}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Cryptographic & On-Chain Telemetry */}
      <View
        className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2"
        style={{
          backgroundColor: '#020617',
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: '#1e293b',
          gap: 6
        }}
      >
        <Text
          className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1"
          style={{
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 4
          }}
        >
          Hardware & Polygon Ledger Telemetry
        </Text>
        <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
          NTAG 424 DNA UID:{' '}
          <Text className="text-cyan-400 font-mono" style={{ color: '#22d3ee', fontWeight: '600' }}>
            {certificate.tagUid}
          </Text>
        </Text>
        <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
          SUN Monotonic Counter:{' '}
          <Text className="text-emerald-400 font-mono" style={{ color: '#34d399', fontWeight: '600' }}>
            #{certificate.readCounter}
          </Text>
        </Text>
        <Text className="text-slate-400 text-xs" style={{ color: '#94a3b8', fontSize: 12 }}>
          ERC-721 Token ID:{' '}
          <Text className="text-white font-mono" style={{ color: '#ffffff', fontWeight: '600' }}>
            #{certificate.tokenId}
          </Text>
        </Text>
        <Text
          className="text-slate-400 text-xs"
          numberOfLines={1}
          style={{ color: '#94a3b8', fontSize: 12 }}
        >
          IPFS Forensic Macro CID:{' '}
          <Text className="text-indigo-400 font-mono" style={{ color: '#818cf8' }}>
            ipfs://{certificate.ipfsMetadataCid}
          </Text>
        </Text>
        <Text
          className="text-slate-400 text-xs"
          numberOfLines={1}
          style={{ color: '#94a3b8', fontSize: 12 }}
        >
          EIP-712 Relayer Claim Sig:{' '}
          <Text className="text-slate-300 font-mono" style={{ color: '#cbd5e1' }}>
            {certificate.claimSignature.signature.slice(0, 26)}...
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};
