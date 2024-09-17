import React, { memo } from 'react'
import { TouchableOpacity } from 'react-native'

import getStyles from '../styles'

import { SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props {
  hasContentTextInput: boolean
  sendMessage(): void
}

const SendButton = memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const buttonColor = props.hasContentTextInput ? theme.colors.green : theme.colors.secondary
  const iconColor = props.hasContentTextInput ? theme.colors.white : theme.colors.primaryText

  return (
    <TouchableOpacity
      style={[styles.iconContainer, { backgroundColor: buttonColor }]}
      accessible
      accessibilityLabel="send"
      activeOpacity={0.6}
      disabled={!props.hasContentTextInput}
      onPress={props.sendMessage}
    >
      <SvgIcon name="send" fill={iconColor} />
    </TouchableOpacity>
  )
})

export default SendButton
