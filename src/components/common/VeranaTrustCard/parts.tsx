import React, { FC, ReactElement } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import Text from '../Text'
import styles, { veranaCardColors } from './styles'

type IconProps = { color: string; size?: number }

export const CheckIcon: FC<IconProps> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="m5 12 5 5L20 7" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
)

export const CrossIcon: FC<IconProps> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
  </Svg>
)

export const InfoIcon: FC<IconProps> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
    <Path d="M12 11v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Circle cx={12} cy={7.6} r={1.1} fill={color} />
  </Svg>
)

export const LockIcon: FC<IconProps> = ({ color, size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={5} y={11} width={14} height={9} rx={2} stroke={color} strokeWidth={1.8} fill="none" />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </Svg>
)

export const ArrowUpRightIcon: FC<IconProps> = ({ color, size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M7 17 17 7M9 7h8v8"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
)

export const VeranaMark: FC<{ size?: number }> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width={64} height={64} rx={12} fill={veranaCardColors.verana} />
    <Path d="M46.3 22.8 32 50.4 17.7 22.8l1.9-3.4 2 3.5L32 43.4l10.4-20.5 2 -3.5 1.9 3.4Z" fill="#ffffff" />
    <Path d="M22.4 15.8 32 34.2l9.3-18.4H22.4Z" fill="#ffffff" />
  </Svg>
)

const EU_STARS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6
  return { cx: 10 + 6 * Math.sin(angle), cy: 10 - 6 * Math.cos(angle) }
})

const FLAG_ART: Record<string, ReactElement> = {
  CH: (
    <>
      <Rect width={20} height={20} rx={3} fill="#DA291C" />
      <Path d="M8.6 4h2.8v4.6H16v2.8h-4.6V16H8.6v-4.6H4V8.6h4.6z" fill="#ffffff" />
    </>
  ),
  FR: (
    <>
      <Rect width={20} height={20} rx={3} fill="#ffffff" />
      <Path d="M0 3a3 3 0 0 1 3-3h3.7v20H3a3 3 0 0 1-3-3z" fill="#002395" />
      <Path d="M13.3 0H17a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-3.7z" fill="#ED2939" />
    </>
  ),
  ES: (
    <>
      <Rect width={20} height={20} rx={3} fill="#F1BF00" />
      <Path d="M0 5V3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2z" fill="#AA151B" />
      <Path d="M0 15h20v2a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" fill="#AA151B" />
    </>
  ),
  SE: (
    <>
      <Rect width={20} height={20} rx={3} fill="#006AA7" />
      <Path d="M6 0h4v20H6z" fill="#FECC02" />
      <Path d="M0 8h20v4H0z" fill="#FECC02" />
    </>
  ),
  DE: (
    <>
      <Rect width={20} height={20} rx={3} fill="#DD0000" />
      <Path d="M0 6.7V3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3.7z" fill="#000000" />
      <Path d="M0 13.3h20V17a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" fill="#FFCE00" />
    </>
  ),
  KY: (
    <>
      <Rect width={20} height={20} rx={3} fill="#00247D" />
      <Path d="M0 0h10v7H0z" fill="#012169" />
      <Path d="M0 0l10 7M10 0L0 7" stroke="#ffffff" strokeWidth={1.4} fill="none" />
      <Path d="M5 0v7M0 3.5h10" stroke="#ffffff" strokeWidth={2.2} fill="none" />
      <Path d="M5 0v7M0 3.5h10" stroke="#C8102E" strokeWidth={1.2} fill="none" />
    </>
  ),
  EU: (
    <>
      <Rect width={20} height={20} rx={3} fill="#003399" />
      {EU_STARS.map((star) => (
        <Circle key={`${star.cx}-${star.cy}`} cx={star.cx} cy={star.cy} r={1.1} fill="#FFCC00" />
      ))}
    </>
  ),
}

// Drawn, never emoji: regional-indicator pairs fall back inconsistently across Android builds.
export const CountryFlag: FC<{ code?: string; size?: number }> = ({ code, size = 15 }) => {
  if (!code) return null
  const key = code.toUpperCase()
  const art = FLAG_ART[key]
  if (!art) return <Text style={styles.flagCode}>{key}</Text>
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      {art}
    </Svg>
  )
}

export type StepTone = 'ok' | 'bad' | 'none'

export const StepTick: FC<{ tone: StepTone }> = ({ tone }) => {
  const backgroundColor =
    tone === 'ok' ? veranaCardColors.ok : tone === 'bad' ? veranaCardColors.bad : veranaCardColors.noneRail
  return (
    <View style={[styles.tick, { backgroundColor }]}>
      {tone === 'ok' ? (
        <CheckIcon color={veranaCardColors.onTint} />
      ) : tone === 'bad' ? (
        <CrossIcon color={veranaCardColors.onTint} />
      ) : (
        <Text style={styles.tickUnknownText}>?</Text>
      )}
    </View>
  )
}

export const SectionLabel: FC<{ children: string }> = ({ children }) => (
  <Text fontFamily="EuclidCircularA-Medium" style={styles.sectionLabel}>
    {children.toUpperCase()}
  </Text>
)

export const RegistryChip: FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null
  return (
    <View style={styles.registryChip}>
      <Text style={styles.registryChipLabel}>{label}</Text>
      <Text style={styles.registryChipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}
