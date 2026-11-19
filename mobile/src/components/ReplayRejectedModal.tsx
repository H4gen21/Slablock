import React from 'react';
import { Modal, Text, View } from 'react-native';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';
import { Button } from './Button';
import { Icon } from './Icon';

interface ReplayRejectedModalProps {
  visible: boolean;
  errorMessage: string;
  onClose: () => void;
}

export function parseReplayCounters(message: string): {
  incoming: number;
  last: number;
} {
  const match = message.match(/counter\s+(\d+).*?\((\d+)\)/i);
  if (match) {
    return {
      incoming: Number(match[1]),
      last: Number(match[2])
    };
  }
  return { incoming: 1, last: 5 };
}

export const ReplayRejectedModal: React.FC<ReplayRejectedModalProps> = ({
  visible,
  errorMessage,
  onClose
}) => {
  const { incoming, last } = parseReplayCounters(errorMessage);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
      >
        <View
          style={[
            CARD_SHADOW,
            {
              width: '100%',
              maxWidth: 400,
              borderRadius: 24,
              padding: 24
            }
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: COLORS.roseSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}
          >
            <Icon name="alert" size={24} color={COLORS.rose} />
          </View>

          <Text style={[TYPE.h2, { color: COLORS.ink }]}>
            Replay rejected
          </Text>
          <Text
            style={[
              TYPE.body,
              {
                color: COLORS.inkSecondary,
                marginTop: 8
              }
            ]}
          >
            The chip’s read counter didn’t advance past the last accepted tap, so
            this scan was blocked as a copied link or cloned tag.
          </Text>

          <View
            style={{
              backgroundColor: COLORS.roseSoft,
              borderRadius: 16,
              padding: 16,
              marginVertical: 18,
              alignItems: 'center'
            }}
          >
            <Text
              style={{
                color: COLORS.roseDark,
                fontSize: 28,
                fontFamily: FONT_FAMILIES.lexendBold
              }}
            >
              {incoming} ≤ {last}
            </Text>
            <Text
              style={[
                TYPE.small,
                { color: COLORS.roseDark, marginTop: 4 }
              ]}
            >
              Incoming counter {incoming} ≤ recorded counter {last}
            </Text>
          </View>

          <Button
            label="Got it"
            variant="danger"
            onPress={onClose}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </Modal>
  );
};
