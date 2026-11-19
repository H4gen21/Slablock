import { Platform, type ViewStyle } from 'react-native';
import type { OnChainItemState } from '../abi/SlabRegistry';
import { FONT_FAMILIES } from './typography';

export type Tone = 'emerald' | 'amber' | 'rose' | 'brand' | 'slate';

/**
 * Dark palette (taggrading.com look, SlabLock yellow as the brand accent).
 * Raw values from the design review; everything else is derived from them.
 */
export const PALETTE = {
  bg: '#07080B',
  bgRaised: '#0E1116',
  card: '#111419',
  cardHi: '#171B22',
  line: '#22262E',
  lineStrong: '#343A45',
  ink: '#FFFFFF',
  inkSoft: '#C9CED8',
  muted: '#7D8594',
  yellow: '#FFD84D',
  yellowDeep: '#E0A800',
  yellowSoft: 'rgba(255,216,77,0.12)',
  pale: '#9FD0FF',
  mauve: '#B98AA6',
  pink: '#E3A6C4',
  success: '#3DDC97',
  warning: '#FFB020',
  danger: '#FF5C6C'
} as const;

const DARK_COLORS = {
  // New names from the design review
  ...PALETTE,
  paleSoft: 'rgba(159,208,255,0.12)',
  /** Text and icons placed on the yellow accent. */
  onAccent: PALETTE.bg,

  // Existing names, kept so screens do not break
  bgElevated: PALETTE.card,
  bgSoft: PALETTE.bgRaised,
  border: PALETTE.line,
  tabBarBg: 'rgba(14, 17, 22, 0.94)',
  tabInactive: PALETTE.muted,
  toolbarBg: 'rgba(7, 8, 11, 0.9)',
  yellowBorder: 'rgba(255,216,77,0.35)',
  inkSecondary: PALETTE.inkSoft,
  inkMuted: PALETTE.muted,
  white: '#FFFFFF',

  emerald: PALETTE.success,
  emeraldDark: PALETTE.success,
  emeraldSoft: 'rgba(61,220,151,0.12)',
  emeraldBorder: 'rgba(61,220,151,0.35)',

  amber: PALETTE.warning,
  amberDark: PALETTE.warning,
  amberSoft: 'rgba(255,176,32,0.12)',
  amberBorder: 'rgba(255,176,32,0.35)',

  rose: PALETTE.danger,
  roseDark: PALETTE.danger,
  roseSoft: 'rgba(255,92,108,0.12)',
  roseBorder: 'rgba(255,92,108,0.35)'
} as const;

export type ThemeMode = 'light' | 'dark';

/**
 * Palette read at render time. The app is dark-only now; applyTheme() is kept
 * so existing callers keep compiling.
 */
export const COLORS: Record<keyof typeof DARK_COLORS, string> = {
  ...DARK_COLORS
};

export function getTheme(): ThemeMode {
  return 'dark';
}

export function applyTheme(_mode: ThemeMode): void {
  Object.assign(COLORS, DARK_COLORS);
}

export const FONTS = {
  sans: FONT_FAMILIES.manropeRegular,
  display: FONT_FAMILIES.lexendSemiBold,
  mono: FONT_FAMILIES.monoMedium
} as const;

/** Outlined dark card: thin hairline border plus a subtle inner top highlight. */
export const CARD_SHADOW: ViewStyle = Platform.select({
  web: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 32px -20px rgba(0,0,0,0.8)'
  },
  default: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4
  }
}) as ViewStyle;

export interface StateToneSpec {
  tone: Tone;
  /** State name shown in chips and as the detail banner title. */
  label: string;
  /** Fallback banner body when the slab has no state note of its own. */
  description: string;
  bg: string;
  border: string;
  fg: string;
  accent: string;
  ringColor: string;
}

/**
 * Only SEALED and IN_TRANSIT are produced by the NFC / custody flow. Any other
 * chain state (MINTED, or a legacy UNSEALED / VOID) is shown as "Not sealed"
 * with the neutral pale-blue color.
 */
export function getStateTone(state: OnChainItemState): StateToneSpec {
  switch (state) {
    case 'SEALED':
      return {
        tone: 'emerald',
        label: 'Sealed',
        description: 'Encapsulated and registered on-chain.',
        bg: COLORS.emeraldSoft,
        border: COLORS.emeraldBorder,
        fg: COLORS.success,
        accent: COLORS.success,
        ringColor: COLORS.yellowDeep
      };
    case 'IN_TRANSIT':
      return {
        tone: 'amber',
        label: 'In transit',
        description:
          'Custody transfer started. Waiting for the recipient to tap the slab.',
        bg: COLORS.amberSoft,
        border: COLORS.amberBorder,
        fg: COLORS.warning,
        accent: COLORS.warning,
        ringColor: COLORS.warning
      };
    default:
      return {
        tone: 'slate',
        label: 'Not sealed',
        description: 'This slab is not in a sealed state on-chain.',
        bg: COLORS.paleSoft,
        border: 'rgba(159,208,255,0.35)',
        fg: COLORS.pale,
        accent: COLORS.pale,
        ringColor: COLORS.pale
      };
  }
}

export function getGradeWord(grade: number): string {
  if (grade >= 10) return 'Gem Mint';
  if (grade >= 9.5) return 'Mint+';
  if (grade >= 9.0) return 'Mint';
  if (grade >= 8.5) return 'NM-MT+';
  return 'NM-MT';
}

export function truncateMiddle(
  value: string,
  startChars = 6,
  endChars = 4
): string {
  if (!value) return '';
  if (value.length <= startChars + endChars + 3) return value;
  return `${value.slice(0, startChars)}…${value.slice(-endChars)}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats an ISO date as `D MMM YYYY` in Asia/Jakarta time (UTC+7, no DST).
 * Done by hand so it does not depend on Intl time-zone support in Hermes.
 */
export function formatGradedDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const jakarta = new Date(t + 7 * 60 * 60 * 1000);
  return `${jakarta.getUTCDate()} ${MONTHS[jakarta.getUTCMonth()]} ${jakarta.getUTCFullYear()}`;
}

export function formatCountdown(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? `0${s}` : s}`;
}

export function sameAddress(a?: string | null, b?: string | null): boolean {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}
