import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { CornerScore, EdgeScore, GradeReport } from '../../types/report';
import { COLORS, formatGradedDate, getGradeWord } from '../../theme/tokens';
import { FONT_FAMILIES, TYPE } from '../../theme/typography';
import { Icon } from '../Icon';
import { MetricRows, REGION_LABEL, Wordmark } from './shared';

type Scored = (CornerScore | EdgeScore) & { kind: 'Corner' | 'Edge' };

function imperfect(report: GradeReport): Scored[] {
  const all: Scored[] = [
    ...report.corners.map((c) => ({ ...c, kind: 'Corner' as const })),
    ...report.edges.map((e) => ({ ...e, kind: 'Edge' as const }))
  ];
  // Perfect regions (every metric 1000) are null and are not listed.
  return all.filter(
    (s) => s.fray < 1000 || s.fill < 1000 || ('angle' in s && (s.angle ?? 1000) < 1000)
  );
}

/** Bottom sheet listing the 1000-point scores of every imperfect region. */
const ScoreSheet: React.FC<{ report: GradeReport; onClose: () => void }> = ({
  report,
  onClose
}) => {
  const rows = imperfect(report);
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close scores"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: COLORS.toolbarBg }}
      />
      <View
        accessibilityViewIsModal
        style={{
          backgroundColor: COLORS.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.line,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          maxHeight: '75%',
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center'
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.lineStrong,
            marginBottom: 14
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6
          }}
        >
          <Text style={[TYPE.sectionHeading, { color: COLORS.ink, letterSpacing: 2 }]}>
            Region scores
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="close" size={20} color={COLORS.ink} />
          </TouchableOpacity>
        </View>
        <Text style={[TYPE.small, { color: COLORS.muted, marginBottom: 14 }]}>
          Out of 1000. Regions that scored 1000 on every metric are not listed.
        </Text>

        {rows.length === 0 ? (
          <Text
            style={[TYPE.body, { color: COLORS.muted, textAlign: 'center', paddingVertical: 24 }]}
          >
            All regions scored 1000
          </Text>
        ) : (
          <ScrollView>
            {rows.map((s, i) => (
              <View
                key={`${s.kind}_${s.side}_${s.region}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: COLORS.line
                }}
              >
                <View>
                  <Text style={[TYPE.micro, { color: COLORS.muted }]}>
                    {s.side} · {s.kind}
                  </Text>
                  <Text
                    style={[TYPE.listItemTitle, { color: COLORS.ink, textTransform: 'uppercase' }]}
                  >
                    {REGION_LABEL[s.region]}
                  </Text>
                </View>
                <MetricRows
                  rows={[
                    ['Fray', s.fray],
                    ['Fill', s.fill],
                    ...('angle' in s && s.angle !== undefined
                      ? ([['Angle', s.angle]] as Array<[string, number]>)
                      : [])
                  ]}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

/** Wordmark box with "VIEW SCORE" on the left, big grade on the right. */
export const GradeHeader: React.FC<{ grade: number; report: GradeReport }> = ({
  grade,
  report
}) => {
  const [open, setOpen] = useState(false);
  const graded = formatGradedDate(report.gradedAt);
  const gradeText = Number.isInteger(grade) ? String(grade) : grade.toFixed(1);

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View score"
          accessibilityHint="Opens the 1000-point score for each region"
          onPress={() => setOpen(true)}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 170,
              aspectRatio: 1.95,
              borderRadius: 20,
              backgroundColor: COLORS.bgRaised,
              borderWidth: 1,
              borderColor: COLORS.lineStrong,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Wordmark size={19} />
          </View>
          <Text
            style={[
              TYPE.sectionHeading,
              { color: COLORS.ink, fontSize: 19, letterSpacing: 1.5, marginTop: 12 }
            ]}
          >
            View score
          </Text>
        </TouchableOpacity>

        <View
          accessible
          accessibilityLabel={`Grade ${gradeText}, ${getGradeWord(grade)}`}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text
            style={{
              fontFamily: FONT_FAMILIES.lexendBold,
              fontSize: 72,
              lineHeight: 80,
              color: COLORS.ink
            }}
          >
            {gradeText}
          </Text>
          <Text
            style={[
              TYPE.sectionHeading,
              { color: COLORS.ink, fontSize: 19, letterSpacing: 1.5, marginTop: 4 }
            ]}
          >
            {getGradeWord(grade)}
          </Text>
        </View>
      </View>

      {graded ? (
        <Text style={[TYPE.small, { color: COLORS.muted, textAlign: 'center', marginTop: 16 }]}>
          Graded {graded}
        </Text>
      ) : null}

      {open && <ScoreSheet report={report} onClose={() => setOpen(false)} />}
    </View>
  );
};
