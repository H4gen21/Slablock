import React from 'react';
import { Text, View } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { TYPE } from '../../theme/typography';

/** Thin rule with a centered "CERT # …" pill. */
export const CertDivider: React.FC<{ certId: string }> = ({ certId }) => (
  <View
    accessibilityRole="header"
    style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 28 }}
  >
    <View style={{ flex: 1, height: 1, backgroundColor: COLORS.lineStrong }} />
    <View
      style={{
        backgroundColor: COLORS.cardHi,
        borderWidth: 1,
        borderColor: COLORS.lineStrong,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        maxWidth: '80%'
      }}
    >
      <Text
        numberOfLines={1}
        style={[TYPE.micro, { color: COLORS.ink, fontSize: 13, letterSpacing: 1.6 }]}
      >
        CERT # {certId}
      </Text>
    </View>
    <View style={{ flex: 1, height: 1, backgroundColor: COLORS.lineStrong }} />
  </View>
);
