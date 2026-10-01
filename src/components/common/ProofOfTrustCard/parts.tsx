import React, { FC } from 'react'
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
