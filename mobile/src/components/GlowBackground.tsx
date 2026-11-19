import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../theme/tokens';

/**
 * Near-black page background with two soft glows behind the content:
 * pink (10%) from the top-right and pale blue (6%) from the bottom-left.
 */
export const GlowBackground: React.FC = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <Defs>
        <RadialGradient id="glowTopRight" cx="100%" cy="0%" rx="70%" ry="55%">
          <Stop offset="0%" stopColor={COLORS.pink} stopOpacity="0.10" />
          <Stop offset="100%" stopColor={COLORS.pink} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowBottomLeft" cx="0%" cy="100%" rx="70%" ry="55%">
          <Stop offset="0%" stopColor={COLORS.pale} stopOpacity="0.06" />
          <Stop offset="100%" stopColor={COLORS.pale} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="1000" height="1000" fill={COLORS.bg} />
      <Rect width="1000" height="1000" fill="url(#glowTopRight)" />
      <Rect width="1000" height="1000" fill="url(#glowBottomLeft)" />
    </Svg>
  </View>
);
