import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ServiceStatus } from '@src/model'
import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import SvgIcon, { IconsNames } from '../SvgIcon'
import styles from './styles'

type Props = {
  style?: StyleProp<ViewStyle>
  status: ServiceStatus
}

const VerifiedIcon = ({ style, status }: Props) => {
  const theme = useTheme()
  const iconNames: Record<ServiceStatus, keyof IconsNames> = {
    [ServiceStatus.Trusted]: 'verifiedMark',
    [ServiceStatus.Untrusted]: 'warning',
    [ServiceStatus.Unverified]: 'warning',
    [ServiceStatus.Resolving]: 'warning',
  }

  const backgroundColors: Record<ServiceStatus, string> = {
    [ServiceStatus.Trusted]: theme.colors.green,
    [ServiceStatus.Untrusted]: theme.colors.red,
    [ServiceStatus.Unverified]: theme.colors.lightGrey,
    [ServiceStatus.Resolving]: theme.colors.lightGrey,
  }
  const backgroundColor = backgroundColors[status]

  const dimensions = status === ServiceStatus.Trusted ? '80%' : '65%'
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <SvgIcon name={iconNames[status]} fill={theme.colors.white} width={dimensions} height={dimensions} />
    </View>
  )
}

export default VerifiedIcon
