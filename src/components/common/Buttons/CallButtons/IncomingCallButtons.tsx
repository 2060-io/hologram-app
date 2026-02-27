import React from 'react'
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native'

import SvgIcon, { IconsNames } from '@src/components/common/SvgIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

interface BaseButtonProps extends TouchableOpacityProps {
  isAnswerCall?: boolean
}

const BaseButton = ({ isAnswerCall = true, ...buttonProps }: BaseButtonProps) => {
  const theme = useTheme()
  const backgroundColor = isAnswerCall ? theme.colors.green : theme.colors.red
  const iconName = isAnswerCall ? 'phoneUp' : 'phoneEnd'
  return (
    <TouchableOpacity {...buttonProps} style={[styles.container, { backgroundColor }]}>
      <SvgIcon name={iconName as keyof IconsNames} fill={theme.colors.white} width={'50%'} height={'50%'} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const HangupButton = (props: TouchableOpacityProps) => {
  return <BaseButton isAnswerCall={false} {...props} />
}

const AnswerButton = (props: TouchableOpacityProps) => {
  return <BaseButton {...props} />
}

export { AnswerButton, HangupButton }
