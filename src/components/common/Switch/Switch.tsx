import React from 'react'
import { Switch } from 'react-native'

import { CustomSwitchProps } from './SwitchProps'
import styles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { hexTransparency } from '@2060/utils/colorUtils'

const CustomSwitch = ({ ...props }: CustomSwitchProps) => {
  const theme = useTheme()

  const onThumbColor = theme.colors.green
  const offThumbColor = theme.isDarkMode ? hexTransparency('#F5F7F8', '1A') : '#CDD8DB'
  const trackColor = { false: theme.colors.primary, true: hexTransparency(theme.colors.green, '4f') }

  return (
    <Switch
      style={[styles.switch, props.style]}
      trackColor={trackColor}
      thumbColor={props.isChecked ? onThumbColor : offThumbColor}
      value={props.isChecked}
      onValueChange={props.onToggle}
      disabled={props.isDisabled}
      {...props}
    />
  )
}

export default CustomSwitch
