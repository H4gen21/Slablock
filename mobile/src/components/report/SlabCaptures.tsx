import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { MockCard } from '../MockCard';
import { ReportIcon } from './ReportIcon';
import { BlockHeading, FadeIn, FRAME, Wordmark } from './shared';

interface SlabCapturesProps {
  slabKey: string;
  short: string;
  grade: number;
  gradeWord: string;
  certId: string;
}

/** "Graded images": the placeholder card shown inside a slab outline. */
export const SlabCaptures: React.FC<SlabCapturesProps> = ({
  slabKey,
  short,
  grade,
  gradeWord,
  certId
}) => (
  <View>
    <BlockHeading
      icon={<ReportIcon name="slab" size={56} color={COLORS.ink} strokeWidth={1.6} />}
      title="Graded images"
    />
    <Text
      style={[
        TYPE.body,
        { color: COLORS.muted, textAlign: 'center', marginBottom: 28, paddingHorizontal: 8 }
      ]}
    >
      Captures of the card inside its slab. High-resolution downloads will be available once the
      images are pinned to IPFS.
    </Text>

    <FadeIn style={{ alignItems: 'center' }}>
      <View style={[FRAME, { padding: 20, backgroundColor: COLORS.bg, alignItems: 'center' }]}>
        {/* Slab shell */}
        <View
          style={{
            borderWidth: 2,
            borderColor: COLORS.lineStrong,
            borderRadius: 14,
            padding: 12,
            backgroundColor: COLORS.bgRaised,
            alignItems: 'center',
            width: 240
          }}
        >
          {/* Slab label */}
          <View
            style={{
              alignSelf: 'stretch',
              borderWidth: 1,
              borderColor: COLORS.lineStrong,
              borderRadius: 4,
              padding: 8,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ alignSelf: 'flex-start' }}>
                <Wordmark size={9} />
              </View>
              <Text
                numberOfLines={1}
                style={[TYPE.micro, { color: COLORS.inkSoft, fontSize: 9, lineHeight: 12 }]}
              >
                {short}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontFamily: FONT_FAMILIES.monoMedium, fontSize: 8, color: COLORS.muted }}
              >
                {certId}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: FONT_FAMILIES.lexendBold,
                  fontSize: 22,
                  lineHeight: 24,
                  color: COLORS.ink
                }}
              >
                {Number.isInteger(grade) ? grade : grade.toFixed(1)}
              </Text>
              <Text style={[TYPE.micro, { color: COLORS.inkSoft, fontSize: 7, lineHeight: 9 }]}>
                {gradeWord}
              </Text>
            </View>
          </View>
          <MockCard id={`slabcap_${slabKey}`} grade={grade} width={190} />
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Download graded image (not available yet)"
        accessibilityState={{ disabled: true }}
        disabled
        // TODO: download the high-res capture once it is pinned to IPFS.
        onPress={() => undefined}
        style={{
          marginTop: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.line,
          backgroundColor: COLORS.card,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.45
        }}
      >
        <ReportIcon name="download" size={20} color={COLORS.ink} />
      </TouchableOpacity>
    </FadeIn>
  </View>
);
