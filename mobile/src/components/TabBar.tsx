import React from 'react';
import {
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { type ScreenName, useApp } from '../state/AppContext';
import { COLORS } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

export const TabBar: React.FC = () => {
  const { user, screen, navigate, viewportMode } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 900 && viewportMode !== 'mobile';

  if (!user || screen === 'SignIn') {
    return null;
  }

  const renderTab = (
    target: ScreenName,
    label: string,
    iconName: IconName
  ) => {
    const active =
      screen === target ||
      (target === 'Collection' &&
        (screen === 'SlabDetail' || screen === 'Transfer'));
    // Selected tab: raised dark pill with a brighter border and yellow icon.
    const color = active ? COLORS.yellow : COLORS.tabInactive;

    return (
      <TouchableOpacity
        key={target}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={() => navigate(target)}
        activeOpacity={0.8}
        style={{
          flex: 1,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <View
          style={{
            width: 48,
            height: 40,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: active ? COLORS.lineStrong : 'transparent',
            backgroundColor: active ? COLORS.cardHi : 'transparent',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon name={iconName} size={22} color={color} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: isWide ? 20 : 0,
        alignItems: 'center',
        zIndex: 50
      }}
    >
      <View
        style={{
          width: isWide ? 460 : '100%',
          height: isWide ? 76 : 74,
          backgroundColor: COLORS.tabBarBg,
          borderWidth: 1,
          borderColor: COLORS.line,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: isWide ? 24 : 0,
          borderBottomRightRadius: isWide ? 24 : 0,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 32px -16px rgba(0,0,0,0.8)'
              } as Record<string, string>)
            : {
                shadowColor: '#000000',
                shadowOpacity: 0.18,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: -4 },
                elevation: 12
              })
        }}
      >
        {renderTab('Home', 'Home', 'home')}
        {renderTab('Collection', 'Collection', 'collection')}

        {/* Centered 62 px yellow FAB raised -34 px with a 5 px bg-colored border and ink scan icon */}
        <View
          style={{
            width: 72,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Scan a slab"
            onPress={() => navigate('Scan')}
            activeOpacity={0.88}
            style={{
              width: 62,
              height: 62,
              borderRadius: 999,
              backgroundColor: COLORS.yellow,
              borderWidth: 5,
              borderColor: COLORS.bg,
              marginTop: -34,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: COLORS.yellowDeep,
              shadowOpacity: 0.34,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10
            }}
          >
            <Icon name="nfc" size={26} color={COLORS.onAccent} />
          </TouchableOpacity>
        </View>

        {renderTab('Activity', 'Activity', 'activity')}
        {renderTab('Profile', 'Profile', 'profile')}
      </View>
    </View>
  );
};
