import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { COLORS } from '../theme/tokens';
import { Icon } from './Icon';

interface NfcRadarProps {
  /** Animate the outgoing pulse waves. */
  active: boolean;
  /** Red error styling (replay rejected). */
  error?: boolean;
  reduceMotion?: boolean;
}

/**
 * NFC radar used by Scan and the Transfer screen: three concentric rings,
 * three looping pulse waves while active, and a solid yellow core.
 */
export const NfcRadar: React.FC<NfcRadarProps> = ({
  active,
  error = false,
  reduceMotion = false
}) => {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      return;
    }

    const createWave = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      );

    const loops = [
      createWave(wave1, 0),
      createWave(wave2, 550),
      createWave(wave3, 1100)
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, reduceMotion, wave1, wave2, wave3]);

  const coreColor = error ? COLORS.rose : COLORS.yellow;
  const ringRgb = error ? '214, 69, 69' : '224, 168, 0';

  const ring = (size: number, borderAlpha: number, fillAlpha: number) => (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: `rgba(${ringRgb}, ${borderAlpha})`,
        backgroundColor: `rgba(${ringRgb}, ${fillAlpha})`
      }}
    />
  );

  return (
    <View
      style={{
        width: 240,
        height: 240,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {ring(228, 0.18, 0.04)}
      {ring(172, 0.28, 0.06)}
      {ring(120, 0.4, 0.1)}

      {active &&
        !reduceMotion &&
        [wave1, wave2, wave3].map((wave, idx) => (
          <Animated.View
            key={idx}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 84,
              height: 84,
              borderRadius: 999,
              borderWidth: 2.5,
              borderColor: error ? COLORS.rose : COLORS.yellowDeep,
              opacity: wave.interpolate({
                inputRange: [0, 1],
                outputRange: [0.65, 0]
              }),
              transform: [
                {
                  scale: wave.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.65]
                  })
                }
              ]
            }}
          />
        ))}

      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 999,
          backgroundColor: coreColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: error ? COLORS.rose : COLORS.yellowDeep,
          shadowOpacity: 0.34,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8
        }}
      >
        <Icon name="nfc" size={34} color={error ? COLORS.ink : COLORS.onAccent} />
      </View>
    </View>
  );
};
