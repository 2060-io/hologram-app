import React, { memo } from 'react'
import { TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  text?: string
  onPress?(): void
}

const BaseSystemMessageView = ({ text = '', onPress = () => {} }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <TouchableOpacity style={styles.containerMessage} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.textMessage}>{text}</Text>
    </TouchableOpacity>
  )
}

export default memo(BaseSystemMessageView)
