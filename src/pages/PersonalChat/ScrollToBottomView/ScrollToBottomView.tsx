import React from 'react'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import { Icon, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  numberNewMessages: number
  onScrollToBottom(): void
}

const ScrollToBottom: React.FC<Props> = ({ numberNewMessages, onScrollToBottom }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onScrollToBottom}
      hitSlop={{ top: 5, left: 5, right: 5, bottom: 5 }}
    >
      <Icon as="Ionicons" name="arrow-down-sharp" size={22} color={theme.colors.primaryText} />
      {!!numberNewMessages && (
        <View style={styles.containerMsgNew}>
          <Text typography="SFPro-Medium" style={styles.newMsgText}>
            {numberNewMessages}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default ScrollToBottom
