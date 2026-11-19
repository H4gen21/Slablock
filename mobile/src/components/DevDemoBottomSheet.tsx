import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type DemoTriggerScenario =
  | 'VALID_CHARIZARD_SEALED'
  | 'VALID_PIKACHU_SEALED'
  | 'REPLAY_ATTACK';

interface DevDemoBottomSheetProps {
  onSelectScenario: (scenario: DemoTriggerScenario) => void;
  isLoading: boolean;
}

export const DevDemoBottomSheet: React.FC<DevDemoBottomSheetProps> = ({
  onSelectScenario,
  isLoading
}) => {
  return (
    <View
      className="w-full bg-slate-900/95 border-t border-slate-700 rounded-t-3xl px-4 pt-3 pb-6 mt-4"
      style={{
        width: '100%',
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderColor: '#334155',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        marginTop: 16
      }}
    >
      <View
        className="w-10 h-1 bg-slate-600 rounded-full self-center mb-2"
        style={{
          width: 40,
          height: 4,
          backgroundColor: '#475569',
          borderRadius: 999,
          alignSelf: 'center',
          marginBottom: 10
        }}
      />
      <View
        className="flex-row items-center justify-between mb-3"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}
      >
        <Text
          className="text-xs font-bold uppercase tracking-widest text-amber-400"
          style={{
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#fbbf24'
          }}
        >
          ⚡ Dev Demo Mode (NTAG 424 DNA Simulator)
        </Text>
        <Text
          className="text-[11px] text-slate-400"
          style={{ fontSize: 11, color: '#94a3b8' }}
        >
          ISO-14443-4 SUN
        </Text>
      </View>

      {/* Button 1: Simulate Valid Tap (Charizard PSA 10 - SEALED) */}
      <TouchableOpacity
        disabled={isLoading}
        onPress={() => onSelectScenario('VALID_CHARIZARD_SEALED')}
        className="w-full bg-emerald-600/20 border border-emerald-500/70 rounded-xl py-3 px-4 mb-2.5"
        style={{
          width: '100%',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          borderWidth: 1,
          borderColor: '#10b981',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 10
        }}
      >
        <Text
          className="text-emerald-300 font-bold text-xs text-center"
          style={{
            color: '#6ee7b7',
            fontWeight: '700',
            fontSize: 13,
            textAlign: 'center'
          }}
        >
          [Simulate Valid Tap (Charizard PSA 10 - SEALED)]
        </Text>
      </TouchableOpacity>

      {/* Button 2: Simulate Pikachu Tap (grade 9.5, sealed) */}
      <TouchableOpacity
        disabled={isLoading}
        onPress={() => onSelectScenario('VALID_PIKACHU_SEALED')}
        className="w-full bg-red-600/20 border border-red-500/70 rounded-xl py-3 px-4 mb-2.5"
        style={{
          width: '100%',
          backgroundColor: 'rgba(239, 68, 68, 0.18)',
          borderWidth: 1,
          borderColor: '#ef4444',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 10
        }}
      >
        <Text
          className="text-red-300 font-bold text-xs text-center"
          style={{
            color: '#fca5a5',
            fontWeight: '700',
            fontSize: 13,
            textAlign: 'center'
          }}
        >
          [Simulate Pikachu Tap (grade 9.5, sealed)]
        </Text>
      </TouchableOpacity>

      {/* Button 3: Simulate Replay Attack (Counter Mismatch Error) */}
      <TouchableOpacity
        disabled={isLoading}
        onPress={() => onSelectScenario('REPLAY_ATTACK')}
        className="w-full bg-amber-600/20 border border-amber-500/70 rounded-xl py-3 px-4"
        style={{
          width: '100%',
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          borderWidth: 1,
          borderColor: '#f59e0b',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16
        }}
      >
        <Text
          className="text-amber-300 font-bold text-xs text-center"
          style={{
            color: '#fcd34d',
            fontWeight: '700',
            fontSize: 13,
            textAlign: 'center'
          }}
        >
          [Simulate Replay Attack (Counter Mismatch Error)]
        </Text>
      </TouchableOpacity>
    </View>
  );
};
