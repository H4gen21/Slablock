import React from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { TYPE } from '../theme/typography';
import { Icon } from './Icon';

export const Toast: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 24,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 100
      }}
    >
      <View
        style={[
          CARD_SHADOW,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: COLORS.ink,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 999,
            maxWidth: 460
          }
        ]}
      >
        <Icon name="check" size={16} color={COLORS.emerald} />
        <Text style={[TYPE.smallSemiBold, { color: COLORS.bg }]}>
          {toast}
        </Text>
      </View>
    </View>
  );
};
