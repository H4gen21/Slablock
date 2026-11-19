import { type TextStyle } from 'react-native';

/**
 * Typography rules from docs/design/reference.html:
 * - Use ONLY the @expo-google-fonts family names, one family per weight.
 * - NEVER set `fontWeight` together with these families (it causes synthetic double-bold on web).
 * - Lexend Deca: headings, buttons, chips, numbers (including grades and sub-grade values).
 * - Manrope: body text.
 * - JetBrains Mono: only in the Chip and on-chain record values and the Profile wallet.
 */
export const FONT_FAMILIES = {
  lexendRegular: 'LexendDeca_400Regular',
  lexendMedium: 'LexendDeca_500Medium',
  lexendSemiBold: 'LexendDeca_600SemiBold',
  lexendBold: 'LexendDeca_700Bold',
  manropeRegular: 'Manrope_400Regular',
  manropeMedium: 'Manrope_500Medium',
  manropeSemiBold: 'Manrope_600SemiBold',
  manropeBold: 'Manrope_700Bold',
  monoMedium: 'JetBrainsMono_500Medium'
} as const;

export const SIZES = {
  h1: 32,
  h2: 22,
  h3: 17,
  sectionHeading: 16,
  listItemTitle: 15,
  body: 15,
  small: 13,
  chip: 12,
  heroCardText: 19,
  gradeNumber: 52,
  subGradeValue: 15
} as const;

export const TYPE: Record<string, TextStyle> = {
  // H1: page titles and hero. Bold uppercase with wide tracking.
  h1: {
    fontFamily: FONT_FAMILIES.lexendBold,
    fontSize: SIZES.h1,
    lineHeight: 38,
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  h2: {
    fontFamily: FONT_FAMILIES.lexendBold,
    fontSize: SIZES.h2,
    lineHeight: 28
  },
  h3: {
    fontFamily: FONT_FAMILIES.lexendSemiBold,
    fontSize: SIZES.h3,
    lineHeight: 22
  },
  // H2 in the design review: section titles. Bold uppercase, wide tracking.
  sectionHeading: {
    fontFamily: FONT_FAMILIES.lexendBold,
    fontSize: SIZES.sectionHeading,
    lineHeight: 22,
    letterSpacing: 1.6,
    textTransform: 'uppercase'
  },
  // Muted gray uppercase micro-labels (eyebrows, metadata).
  micro: {
    fontFamily: FONT_FAMILIES.lexendSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  heroCardText: {
    fontFamily: FONT_FAMILIES.lexendMedium,
    fontSize: SIZES.heroCardText,
    lineHeight: 26
  },
  listItemTitle: {
    fontFamily: FONT_FAMILIES.lexendSemiBold,
    fontSize: SIZES.listItemTitle,
    lineHeight: 20
  },
  // Pill buttons: uppercase with tracking, like the reference CTAs.
  button: {
    fontFamily: FONT_FAMILIES.lexendBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  chip: {
    fontFamily: FONT_FAMILIES.lexendSemiBold,
    fontSize: SIZES.chip,
    lineHeight: 16
  },
  gradeNumber: {
    fontFamily: FONT_FAMILIES.lexendBold,
    fontSize: SIZES.gradeNumber,
    lineHeight: 56
  },
  subGradeValue: {
    fontFamily: FONT_FAMILIES.lexendSemiBold,
    fontSize: SIZES.subGradeValue,
    lineHeight: 20
  },
  body: {
    fontFamily: FONT_FAMILIES.manropeRegular,
    fontSize: SIZES.body,
    lineHeight: 22
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.manropeMedium,
    fontSize: SIZES.body,
    lineHeight: 22
  },
  bodySemiBold: {
    fontFamily: FONT_FAMILIES.manropeSemiBold,
    fontSize: SIZES.body,
    lineHeight: 22
  },
  small: {
    fontFamily: FONT_FAMILIES.manropeMedium,
    fontSize: SIZES.small,
    lineHeight: 18
  },
  smallSemiBold: {
    fontFamily: FONT_FAMILIES.manropeSemiBold,
    fontSize: SIZES.small,
    lineHeight: 18
  },
  mono: {
    fontFamily: FONT_FAMILIES.monoMedium,
    fontSize: SIZES.small,
    lineHeight: 18
  }
};
