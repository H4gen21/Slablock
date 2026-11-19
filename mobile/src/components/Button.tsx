import React from 'react';
import {
  ActivityIndicator,
  type StyleProp,
  Text,
  TouchableOpacity,
  type ViewStyle
} from 'react-native';
import { CARD_SHADOW, COLORS } from '../theme/tokens';
import { TYPE } from '../theme/typography';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'white' | 'google' | 'soft' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  style
}) => {
  const palette = {
    // Brand CTA: solid yellow pill, dark uppercase text.
    primary: {
      bg: COLORS.yellow,
      fg: COLORS.onAccent,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false
    },
    // Reference CTA: solid white pill, dark uppercase text.
    white: {
      bg: COLORS.ink,
      fg: COLORS.bg,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false
    },
    google: {
      bg: COLORS.card,
      fg: COLORS.ink,
      borderWidth: 1,
      borderColor: COLORS.line,
      shadow: true
    },
    soft: {
      bg: COLORS.yellowSoft,
      fg: COLORS.yellow,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false
    },
    // Secondary: outlined with a thin light border.
    outline: {
      bg: 'transparent',
      fg: COLORS.ink,
      borderWidth: 1,
      borderColor: COLORS.lineStrong,
      shadow: false
    },
    danger: {
      bg: COLORS.danger,
      fg: COLORS.bg,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false
    }
  }[variant];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.84}
      style={[
        palette.shadow ? CARD_SHADOW : null,
        {
          minHeight: 48,
          paddingHorizontal: 20,
          paddingVertical: 13,
          borderRadius: 999,
          backgroundColor: palette.bg,
          borderWidth: palette.borderWidth,
          borderColor: palette.borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: disabled ? 0.55 : 1,
          outlineStyle: 'none'
        } as ViewStyle,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        icon
      )}
      <Text
        style={[
          TYPE.button,
          {
            color: palette.fg
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
