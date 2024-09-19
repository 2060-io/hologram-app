import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, Button } from 'react-native'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { IncomingCallInfo, useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import { DidCommCallType } from '@2060/services/agent/calls/messages/CallOfferMessage'

const CallOfferChatView = ({ metadata }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = getStyles(theme)
  const { joinToCallOffer } = useVideoCallContext()
  const { chatThread } = useChat()

  const { callType, incomingCallInfo } = JSON.parse(metadata.callOfferInfo) as {
    callType: DidCommCallType
    incomingCallInfo: IncomingCallInfo
  }

  const join = () => {
    joinToCallOffer(chatThread?.data.connectionId!, callType, incomingCallInfo)
  }

  return (
    <View style={styles.container}>
      <Text>{t('whatEver')}</Text>
      <Button title="uniser" onPress={join} />
    </View>
  )
}

export default CallOfferChatView
