import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS, type Tone } from '../theme/tokens';
import { TYPE } from '../theme/typography';

function getEventVisual(tone: Tone): {
  bg: string;
  fg: string;
  icon: IconName;
} {
  switch (tone) {
    case 'emerald':
      return {
        bg: COLORS.emeraldSoft,
        fg: COLORS.emeraldDark,
        icon: 'shield'
      };
    case 'amber':
      return {
        bg: COLORS.amberSoft,
        fg: COLORS.amberDark,
        icon: 'alert'
      };
    case 'rose':
      return {
        bg: COLORS.roseSoft,
        fg: COLORS.roseDark,
        icon: 'alert'
      };
    case 'slate':
      return {
        bg: COLORS.bgSoft,
        fg: COLORS.inkSecondary,
        icon: 'close'
      };
    case 'brand':
    default:
      return {
        bg: COLORS.yellowSoft,
        fg: COLORS.yellowDeep,
        icon: 'nfc'
      };
  }
}

export const ActivityScreen: React.FC = () => {
  const { events } = useApp();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 132,
        maxWidth: 1040,
        width: '100%',
        alignSelf: 'center'
      }}
      style={{ flex: 1 }}
    >
      <Text style={[TYPE.h1, { color: COLORS.ink, marginBottom: 16 }]}>
        Activity
      </Text>

      {events.length === 0 && (
        <View style={[CARD_SHADOW, { borderRadius: 18, padding: 18 }]}>
          <Text style={[TYPE.bodyMedium, { color: COLORS.inkSecondary }]}>
            No activity yet. Scans and transfers show up here.
          </Text>
        </View>
      )}

      {events.map((evt) => {
        const vis = getEventVisual(evt.tone);
        return (
          <View
            key={evt.id}
            style={[
              CARD_SHADOW,
              {
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                gap: 14
              }
            ]}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: vis.bg,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name={vis.icon} size={20} color={vis.fg} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[TYPE.listItemTitle, { color: COLORS.ink }]}>
                {evt.title}
              </Text>
              <Text
                style={[
                  TYPE.small,
                  { color: COLORS.inkSecondary, marginTop: 2 }
                ]}
              >
                {evt.subtitle}
              </Text>
            </View>

            <Text style={[TYPE.small, { color: COLORS.inkMuted }]}>
              {evt.time}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};
