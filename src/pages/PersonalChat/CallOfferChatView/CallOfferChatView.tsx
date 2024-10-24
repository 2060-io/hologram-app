import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header } from '../components'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'

const CallOfferChatView = ({ sender, metadata }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { joinCall } = useVideoCallContext()
  const { chatThread } = useChat()
  const { callType, roomId, peerId, wsUrl } = metadata

  const join = () => {
    joinCall(chatThread?.data.connectionId!, callType, { roomId, peerId, wsUrl })
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('preview.callOffer')} leftIconName="video" />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {t('chat.callOfferMessage', { sender: metadata.issuerName ?? sender?.name })}
        </Text>
      </View>
      <BlueButton text={t('general.join')} onPress={join} />
    </View>
  )
}

export default CallOfferChatView
