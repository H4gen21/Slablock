import React from 'react';
import { Text, View } from 'react-native';
import type { GradeReport } from '../../types/report';
import { COLORS, getGradeWord } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { ReportIcon, type ReportIconName } from './ReportIcon';
import { FadeIn, formatShortDate, InfoButton, ordinalSuffix, TILE } from './shared';

interface Stat {
  icon: ReportIconName;
  title: string;
  dateLabel: string;
  value: number;
  ordinal: boolean;
  caption: string;
  info: string;
}

/** Number in a dark pill, with an optional superscript ordinal suffix. */
const NumberPill: React.FC<{ value: number; ordinal: boolean }> = ({ value, ordinal }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: COLORS.bg,
      borderWidth: 1,
      borderColor: COLORS.lineStrong,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minWidth: 64,
      justifyContent: 'center'
    }}
  >
    <Text
      style={{ fontFamily: FONT_FAMILIES.lexendBold, fontSize: 24, lineHeight: 30, color: COLORS.ink }}
    >
      {value}
    </Text>
    {ordinal && (
      <Text
        style={{
          fontFamily: FONT_FAMILIES.lexendBold,
          fontSize: 12,
          lineHeight: 16,
          color: COLORS.ink,
          marginLeft: 1
        }}
      >
        {ordinalSuffix(value)}
      </Text>
    )}
  </View>
);

/** POP / RANK / CHRON tiles. */
export const StatTiles: React.FC<{
  report: GradeReport;
  grade: number;
  onInfo: (msg: string) => void;
}> = ({ report, grade, onInfo }) => {
  const word = getGradeWord(grade);
  const asOf = formatShortDate(report.stats.popAsOf);
  const stats: Stat[] = [
    {
      icon: 'hash',
      title: 'Pop',
      dateLabel: `As of ${asOf}`,
      value: report.stats.pop,
      ordinal: false,
      caption: `${word} graded`,
      info: `Population: how many cards of this exact card have been graded ${word}.`
    },
    {
      icon: 'trophy',
      title: 'Rank',
      dateLabel: `As of ${asOf}`,
      value: report.stats.rank,
      ordinal: true,
      caption: `Highest ${word}`,
      info: `Rank by score among the ${report.stats.rankOf} graded ${word} copies.`
    },
    {
      icon: 'history',
      title: 'Chron',
      dateLabel: `Graded ${formatShortDate(report.gradedAt)}`,
      value: report.stats.chron,
      ordinal: true,
      caption: `${word} graded`,
      info: `Chronological order: this was copy ${report.stats.chron} of ${report.stats.chronOf} to be graded ${word}.`
    }
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 32 }}>
      {stats.map((s) => (
        <FadeIn key={s.title} style={{ flex: 1 }}>
          <View style={[TILE, { paddingTop: 18, paddingBottom: 20, paddingHorizontal: 6, flex: 1 }]}>
            <View style={{ position: 'absolute', top: 10, right: 10 }}>
              <InfoButton label={s.title} onPress={() => onInfo(s.info)} />
            </View>
            <ReportIcon name={s.icon} size={40} color={COLORS.ink} strokeWidth={1.8} />
            <Text
              style={[
                TYPE.sectionHeading,
                { color: COLORS.ink, fontSize: 22, lineHeight: 28, letterSpacing: 1.5, marginTop: 10 }
              ]}
            >
              {s.title}
            </Text>
            <Text
              style={[
                TYPE.micro,
                { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 4, marginBottom: 12 }
              ]}
            >
              {s.dateLabel}
            </Text>
            <NumberPill value={s.value} ordinal={s.ordinal} />
            <Text
              style={[
                TYPE.micro,
                {
                  color: COLORS.inkSoft,
                  fontSize: 12,
                  lineHeight: 16,
                  textAlign: 'center',
                  marginTop: 12
                }
              ]}
            >
              {s.caption}
            </Text>
          </View>
        </FadeIn>
      ))}
    </View>
  );
};
