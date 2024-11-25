import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'

const CallOfferChatView = ({ metadata }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { joinCall } = useVideoCallContext()
  const { chatThread } = useChat()
  const { callType, roomId, peerId, wsUrl } = metadata

  const join = () => {
    joinCall(chatThread?.data.connectionId!, callType, { roomId, peerId, wsUrl })
  }

  const footer: Record<string, React.ReactElement> = {
    a: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={() => {}} style={styles.refuseButton} />
        <BlueButton text={t('call.joinCall')} onPress={join} style={styles.joinButton} />
      </View>
    ),
    b: <State text={t('call.callEnded')} />,
    c: <State text={t('call.callRejected')} type="error" />,
    d: (
      <View style={styles.expiredContainer}>
        <Text typography="EuclidCircularA-Bold" style={styles.expiredText}>
          {t('call.expiredCall')}
        </Text>
      </View>
    ),
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('preview.callOffer')} leftIconName="incomingCall" />
      <View style={styles.subContainer}>
        <Trans
          i18nKey={t('chat.callOfferMessage')}
          typography="EuclidCircularA-Regular"
          style={styles.title}
          parent={Text}
          components={{
            bold: <Text typography="EuclidCircularA-Bold" style={styles.title} />,
          }}
        />
        {footer.a}
      </View>
    </View>
  )
}

export default CallOfferChatView
