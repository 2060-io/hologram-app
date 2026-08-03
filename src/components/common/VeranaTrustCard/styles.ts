import { StyleSheet } from 'react-native'

// The card paints itself as a light card on any theme so the same evaluation has the same face in
// every wallet. These are the canonical playground values, shared with AltMe and Sphereon.
export const veranaCardColors = {
  ink: '#111827',
  body: '#374151',
  sub: '#6B7280',
  faint: '#9CA3AF',
  line: '#E5E7EB',
  card: '#FFFFFF',
  chip: '#F3F4F6',
  ok: '#059669',
  okSoft: '#ECFDF5',
  okRail: '#6EE7B7',
  warn: '#D97706',
  warnLine: '#FDE68A',
  bad: '#DC2626',
  badSoft: '#FEF2F2',
  badRail: '#FCA5A5',
  noneRail: '#D1D5DB',
  neutralSoft: '#F9FAFB',
  brand: '#7C3AED',
  verana: '#763EF0',
  askText: '#1F2937',
  onTint: '#FFFFFF',
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: veranaCardColors.card,
    borderColor: veranaCardColors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    padding: 14,
  },
  didRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  didDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  didText: {
    color: veranaCardColors.sub,
    flexShrink: 1,
    fontSize: 11,
  },
  testnetChip: {
    borderColor: veranaCardColors.warnLine,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  testnetChipText: {
    color: veranaCardColors.warn,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 14,
  },
  sectionLabel: {
    color: veranaCardColors.sub,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  identityBody: {
    flexShrink: 1,
    flexGrow: 1,
  },
  identityHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  identityName: {
    color: veranaCardColors.ink,
    flexShrink: 1,
    fontSize: 15,
  },
  identityDetail: {
    color: veranaCardColors.body,
    fontSize: 12,
    marginTop: 2,
  },
  identityWithheld: {
    color: veranaCardColors.faint,
    fontSize: 12,
    marginTop: 2,
  },
  tick: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  tickUnknownText: {
    color: veranaCardColors.onTint,
    fontSize: 12,
  },
  registryChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: veranaCardColors.chip,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    maxWidth: '100%',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  registryChipLabel: {
    color: veranaCardColors.faint,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  registryChipValue: {
    color: veranaCardColors.body,
    flexShrink: 1,
    fontSize: 10,
  },
  verdictStack: {
    marginTop: 14,
  },
  verdictPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verdictPillLabel: {
    flexShrink: 1,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  verdictNote: {
    fontSize: 12,
    marginTop: 6,
  },
  askBlock: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    padding: 10,
  },
  askCredential: {
    color: veranaCardColors.ink,
    fontSize: 14,
  },
  askRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  askText: {
    color: veranaCardColors.askText,
    flexShrink: 1,
    fontSize: 12,
  },
  conditions: {
    backgroundColor: veranaCardColors.chip,
    borderRadius: 10,
    marginTop: 14,
    padding: 10,
  },
  conditionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  conditionLink: {
    color: veranaCardColors.brand,
    flexShrink: 1,
    fontSize: 12,
  },
  conditionText: {
    color: veranaCardColors.body,
    flexShrink: 1,
    fontSize: 12,
  },
  ageBadge: {
    backgroundColor: veranaCardColors.card,
    borderColor: veranaCardColors.warnLine,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ageBadgeText: {
    color: veranaCardColors.warn,
    fontSize: 10,
  },
  conditionState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginLeft: 'auto',
  },
  conditionIntact: {
    color: veranaCardColors.ok,
    fontSize: 10,
  },
  conditionNoDigest: {
    color: veranaCardColors.faint,
    fontSize: 10,
  },
  explorerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  explorerText: {
    color: veranaCardColors.brand,
    flexShrink: 1,
    fontSize: 12,
  },
  footnote: {
    color: veranaCardColors.faint,
    fontSize: 10,
    marginTop: 10,
  },
  loading: {
    color: veranaCardColors.sub,
    fontSize: 12,
    marginTop: 12,
  },
  flagCode: {
    color: veranaCardColors.faint,
    fontSize: 10,
  },
})

export default styles
