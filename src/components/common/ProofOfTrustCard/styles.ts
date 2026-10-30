import { cardShadowStyles } from '@src/styles/globalStyles'
import { AppTheme } from '@src/styles/types'
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

const NODE_SIZE = 20
const BADGE_SIZE = 20

const getStyles = (colors: VeranaCardColors, theme: AppTheme) =>
  StyleSheet.create({
    card: {
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      marginTop: 16,
      padding: 15,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    logo: {
      flexShrink: 0,
    },
    badge: {
      alignItems: 'center',
      borderColor: theme.colors.primary,
      borderRadius: BADGE_SIZE / 2 + 2,
      borderWidth: 2,
      bottom: -3,
      height: BADGE_SIZE + 4,
      justifyContent: 'center',
      position: 'absolute',
      right: -3,
      width: BADGE_SIZE + 4,
    },
    badgeUnknown: {
      color: colors.onTint,
      fontSize: 12,
      lineHeight: 14,
    },
    headerBody: {
      flex: 1,
      gap: 3,
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    titleDid: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
    },
    declared: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    declaredText: {
      color: colors.warn,
      fontSize: theme.fontSize.sm,
    },
    verdictRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    verdict: {
      fontSize: theme.fontSize.md,
    },
    mark: {
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    meta: {
      marginTop: 10,
    },
    metaText: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.sm,
    },
    retry: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingVertical: 2,
    },
    retryText: {
      color: colors.brand,
      fontSize: theme.fontSize.md,
    },
    chain: {
      marginTop: 14,
    },
    node: {
      flexDirection: 'row',
      gap: 10,
    },
    rail: {
      alignItems: 'center',
      width: NODE_SIZE,
    },
    connector: {
      borderRadius: 1,
      flex: 1,
      marginVertical: 2,
      minHeight: 8,
      width: 2,
    },
    nodeBody: {
      flex: 1,
      paddingBottom: 12,
    },
    nodeBodyLast: {
      paddingBottom: 0,
    },
    nodeLabel: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.sm,
      lineHeight: NODE_SIZE,
    },
    nodeName: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
    },
    nodeDetail: {
      color: colors.body,
      fontSize: theme.fontSize.sm + 1,
      marginTop: 2,
    },
    nodeWithheld: {
      color: colors.faint,
      fontSize: theme.fontSize.sm + 1,
    },
    failures: {
      backgroundColor: colors.badSoft,
      borderRadius: 8,
      gap: 3,
      marginTop: 14,
      padding: 10,
    },
    failuresLabel: {
      color: colors.bad,
      fontSize: theme.fontSize.sm,
    },
    failuresReason: {
      color: colors.bad,
      fontSize: theme.fontSize.sm + 1,
    },
    failuresId: {
      color: colors.sub,
      fontSize: theme.fontSize.sm,
    },
    conditions: {
      backgroundColor: colors.chip,
      borderRadius: 8,
      gap: 8,
      marginTop: 14,
      padding: 10,
    },
    conditionsLabel: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.sm,
    },
    conditionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    ageBadge: {
      borderRadius: 6,
      borderWidth: 1,
      flexShrink: 0,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    ageBadgeNeutral: {
      backgroundColor: theme.colors.primary,
      borderColor: colors.warnLine,
    },
    ageBadgeRestricted: {
      backgroundColor: colors.badSoft,
      borderColor: colors.bad,
    },
    ageBadgeText: {
      fontSize: theme.fontSize.sm - 1,
    },
    conditionText: {
      flexShrink: 1,
      fontSize: theme.fontSize.sm + 1,
    },
    conditionLink: {
      color: colors.brand,
      flexShrink: 1,
      fontSize: theme.fontSize.sm + 1,
    },
    footnote: {
      color: colors.faint,
      fontSize: theme.fontSize.sm - 1,
      marginTop: 10,
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
  })

export default getStyles
