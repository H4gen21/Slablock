import React from 'react';
import { Text, View } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';

interface CardInfoListProps {
  cardName: string;
  cardSet: string;
  variation?: string;
}

/** Splits "Pikachu #58" into the name and the card number. */
function splitNumber(name: string): { name: string; number?: string } {
  const m = name.match(/^(.*?)\s*#\s*(\S+)\s*$/);
  return m ? { name: m[1], number: m[2] } : { name };
}

/** Label/value rows: muted uppercase label, bold uppercase value. */
export const CardInfoList: React.FC<CardInfoListProps> = ({ cardName, cardSet, variation }) => {
  const { name, number } = splitNumber(cardName);
  const rows: Array<[string, string]> = [
    ['Card name', name],
    ['Set name', cardSet],
    ...(number ? ([['Card #', number]] as Array<[string, string]>) : []),
    ...(variation ? ([['Variation', variation]] as Array<[string, string]>) : [])
  ];

  return (
    <View style={{ marginTop: 28, gap: 10 }}>
      {rows.map(([label, value]) => (
        <Text key={label} style={{ lineHeight: 22 }}>
          <Text style={[TYPE.micro, { color: COLORS.muted, fontSize: 13, letterSpacing: 1.2 }]}>
            {label}:{'  '}
          </Text>
          <Text
            style={{
              fontFamily: FONT_FAMILIES.lexendBold,
              fontSize: 15,
              color: COLORS.ink,
              textTransform: 'uppercase',
              letterSpacing: 0.6
            }}
          >
            {value}
          </Text>
        </Text>
      ))}
    </View>
  );
};
