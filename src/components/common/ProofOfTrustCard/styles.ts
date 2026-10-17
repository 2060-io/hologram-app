import { StyleSheet } from 'react-native'

export type VeranaCardColors = {
  ink: string
  body: string
  sub: string
  faint: string
  line: string
  card: string
  chip: string
  ok: string
  okSoft: string
  okRail: string
  warn: string
  warnLine: string
  bad: string
  badSoft: string
  badRail: string
  noneRail: string
  neutralSoft: string
  brand: string
  verana: string
  askText: string
  onTint: string
}

// Must stay identical to the playground palette that AltMe and Sphereon use for the same card
const lightVeranaCardColors: VeranaCardColors = {
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

const darkVeranaCardColors: VeranaCardColors = {
  ink: '#F9FAFB',
  body: '#D1D5DB',
  sub: '#9CA3AF',
  faint: '#6B7280',
  line: '#3B4043',
  card: '#232627',
  chip: '#2F3335',
  ok: '#34D399',
  okSoft: '#0B3A2E',
  okRail: '#059669',
  warn: '#FBBF24',
  warnLine: '#92400E',
  bad: '#F87171',
  badSoft: '#4A1D1D',
  badRail: '#DC2626',
  noneRail: '#4B5563',
  neutralSoft: '#2A2E30',
  brand: '#A78BFA',
  verana: '#763EF0',
  askText: '#E5E7EB',
  onTint: '#FFFFFF',
}

export const getVeranaCardColors = (isDarkMode: boolean) => (isDarkMode ? darkVeranaCardColors : lightVeranaCardColors)

const getStyles = (colors: VeranaCardColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderColor: colors.line,
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
      flexShrink: 0,
      height: 8,
      width: 8,
    },
    didText: {
      color: colors.sub,
      flexShrink: 1,
      fontSize: 11,
    },
    testnetChip: {
      borderColor: colors.warnLine,
      flexShrink: 0,
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    testnetChipText: {
      color: colors.warn,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    section: {
      marginTop: 14,
    },
    sectionLabel: {
      color: colors.sub,
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
    identityName: {
      color: colors.ink,
      flexShrink: 1,
      fontSize: 15,
    },
    identityDetail: {
      color: colors.body,
      fontSize: 12,
      marginTop: 2,
    },
    identityWithheld: {
      color: colors.faint,
      fontSize: 12,
      marginTop: 2,
    },
    tick: {
      alignItems: 'center',
      borderRadius: 10,
      flexShrink: 0,
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    tickUnknownText: {
      color: colors.onTint,
      fontSize: 12,
    },
    registryChip: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.chip,
      borderRadius: 6,
      flexDirection: 'row',
      gap: 4,
      marginTop: 4,
      maxWidth: '100%',
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    registryChipLabel: {
      color: colors.faint,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    registryChipValue: {
      color: colors.body,
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
    conditions: {
      backgroundColor: colors.chip,
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
      color: colors.brand,
      flexShrink: 1,
      fontSize: 12,
    },
    conditionText: {
      color: colors.body,
      flexShrink: 1,
      fontSize: 12,
    },
    ageBadge: {
      backgroundColor: colors.card,
      flexShrink: 0,
      borderColor: colors.warnLine,
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    ageBadgeText: {
      color: colors.warn,
      fontSize: 10,
    },
    footnote: {
      color: colors.faint,
      fontSize: 10,
      marginTop: 10,
    },
  })

export default getStyles
