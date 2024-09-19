import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, Button } from 'react-native'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'

const CallOfferChatView = ({ metadata }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = getStyles(theme)
  const { joinToCallOffer } = useVideoCallContext()
  const { chatThread } = useChat()
  const { callType, roomId, wsUrl } = metadata

  const join = () => {
    joinToCallOffer(chatThread?.data.connectionId!, callType, { roomId, wsUrl })
  }

  return (
    <View style={styles.container}>
      <Text>{t('whatEver')}</Text>
      <Button title="uniser" onPress={join} />
    </View>
  )
}

export default CallOfferChatView
