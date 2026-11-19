import React from 'react';
import { type LayoutChangeEvent, Text, View } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { TYPE } from '../../theme/typography';

interface SectionBarProps {
  title: string;
  /** Horizontal page padding to bleed past, so the bar runs edge to edge. */
  bleed?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}

/** Full-width dark bar with uppercase, widely tracked white text. */
export const SectionBar: React.FC<SectionBarProps> = ({ title, bleed = 20, onLayout }) => (
  <View
    onLayout={onLayout}
    accessibilityRole="header"
    style={{
      marginHorizontal: -bleed,
      marginTop: 40,
      marginBottom: 28,
      paddingVertical: 20,
      paddingHorizontal: bleed + 8,
      backgroundColor: COLORS.bgRaised,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: COLORS.line
    }}
  >
    <Text
      style={[
        TYPE.sectionHeading,
        { color: COLORS.ink, letterSpacing: 3, textAlign: 'center', lineHeight: 24 }
      ]}
    >
      {title}
    </Text>
  </View>
);
