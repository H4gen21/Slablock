import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { User } from '../auth/mockGoogle';
import { AccountChooserModal } from '../components/AccountChooserModal';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { useApp } from '../state/AppContext';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../theme/typography';

const FloatingPill: React.FC<{
  label: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
}> = ({ label, icon, iconBg, iconColor }) => (
  <View
    style={[
      CARD_SHADOW,
      {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999
      }
    ]}
  >
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Icon name={icon} size={14} color={iconColor} />
    </View>
    <Text style={[TYPE.chip, { color: COLORS.ink }]}>{label}</Text>
  </View>
);

export const SignInScreen: React.FC = () => {
  const { setUser, navigate, showToast, reduceMotion } = useApp();
  const [chooserVisible, setChooserVisible] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      floatAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, reduceMotion]);

  const handleSignedIn = (user: User) => {
    setChooserVisible(false);
    setUser(user);
    navigate('Home');
    showToast(`Signed in as ${user.email}`);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40
      }}
      style={{ flex: 1 }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 400,
          alignItems: 'center'
        }}
      >
        {/* .hero-art: white slab rotated -6deg, soft-yellow label with deep-yellow "10", mock card window, and f1/f2/f3 pills */}
        <View
          style={{
            width: 320,
            height: 320,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}
        >
          <Animated.View
            style={[
              CARD_SHADOW,
              {
                transform: [{ translateY: floatAnim }, { rotate: '-6deg' }],
                width: 210,
                borderRadius: 26,
                backgroundColor: COLORS.card,
                padding: 14
              }
            ]}
          >
            {/* Lavender Label Row */}
            <View
              style={{
                backgroundColor: COLORS.yellowSoft,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  numberOfLines={1}
                  style={[TYPE.smallSemiBold, { color: COLORS.ink }]}
                >
                  Charizard #4
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: COLORS.inkSecondary,
                    fontSize: 11,
                    fontFamily: FONT_FAMILIES.manropeMedium,
                    marginTop: 1
                  }}
                >
                  Base Set · 1999
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.yellowDeep,
                  fontSize: 22,
                  fontFamily: FONT_FAMILIES.lexendBold
                }}
              >
                10
              </Text>
            </View>

            {/* Gradient Window */}
            <View
              style={{
                height: 168,
                borderRadius: 18,
                overflow: 'hidden',
                padding: 10
              }}
            >
              <Svg
                width="100%"
                height="100%"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
                <Defs>
                  <LinearGradient id="signInSlabGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={COLORS.yellow} />
                    <Stop offset="55%" stopColor={COLORS.yellowDeep} />
                    <Stop offset="100%" stopColor={COLORS.mauve} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#signInSlabGrad)" />
              </Svg>
              <View
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.55)'
                }}
              />
            </View>
          </Animated.View>

          {/* f1: top-left "Sealed" */}
          <View style={{ position: 'absolute', top: 12, left: 4 }}>
            <FloatingPill
              label="Sealed"
              icon="shield"
              iconBg={COLORS.emeraldSoft}
              iconColor={COLORS.emerald}
            />
          </View>

          {/* f2: middle-right "NFC tap" (below the "10" label so it never overlaps) */}
          <View style={{ position: 'absolute', top: 128, right: -4 }}>
            <FloatingPill
              label="NFC tap"
              icon="nfc"
              iconBg={COLORS.yellowSoft}
              iconColor={COLORS.yellowDeep}
            />
          </View>

          {/* f3: bottom-left "On-chain" */}
          <View style={{ position: 'absolute', bottom: 14, left: 12 }}>
            <FloatingPill
              label="On-chain"
              icon="chain"
              iconBg={COLORS.amberSoft}
              iconColor={COLORS.amber}
            />
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text
          style={[
            TYPE.h1,
            {
              color: COLORS.ink,
              textAlign: 'center'
            }
          ]}
        >
          Know your slab is the real one
        </Text>
        <Text
          style={[
            TYPE.body,
            {
              color: COLORS.inkSecondary,
              textAlign: 'center',
              marginTop: 10,
              marginBottom: 28
            }
          ]}
        >
          Tap the chip in any graded card slab to check its seal, read counter,
          and on-chain certificate.
        </Text>

        {/* Continue with Google: white button with person icon, --line border and shadow */}
        <Button
          label="Continue with Google"
          variant="google"
          icon={<Icon name="profile" size={18} color={COLORS.ink} />}
          onPress={() => setChooserVisible(true)}
          accessibilityLabel="Continue with Google"
          style={{ width: '100%' }}
        />

        <Text
          style={[
            TYPE.small,
            {
              color: COLORS.inkMuted,
              textAlign: 'center',
              marginTop: 14
            }
          ]}
        >
          Demo sign-in. Nothing leaves this page.
        </Text>
      </View>

      <AccountChooserModal
        visible={chooserVisible}
        onClose={() => setChooserVisible(false)}
        onSignedIn={handleSignedIn}
      />
    </ScrollView>
  );
};
