import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import { CallOfferState } from '@2060/model'
import { isNowAfterThanDate } from '@2060/utils/dateUtils'
import { toast } from '@2060/utils/toast'

const CallOfferChatView = ({ metadata, sender, didcommThreadId }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { joinCall } = useVideoCallContext()
  const { chatThread } = useChat()
  const { description, state, offerExpirationTime } = metadata
  const [callState, setCallState] = useState<CallOfferState>(state)

  useEffect(() => {
    if (!offerExpirationTime || state !== CallOfferState.RECEIVED) {
      setCallState(state)
      return
    }
    const isExpired = isNowAfterThanDate(offerExpirationTime)
    const newCallState = isExpired ? CallOfferState.EXPIRED : state
    setCallState(newCallState)
  }, [state])

  const join = () => {
    const isExpired = offerExpirationTime ? isNowAfterThanDate(offerExpirationTime) : false
    if (isExpired) {
      setCallState(CallOfferState.EXPIRED)
      toast({ type: 'error', message: t('call.expiredCallMessage'), duration: 3000 })
    } else {
      const { callType, roomId, peerId, wsUrl } = metadata
      joinCall(chatThread?.data.connectionId!, callType, { roomId, peerId, wsUrl })
    }
  }

  const reject = () => {
    agent?.modules.calls.reject({ connectionId: chatThread?.data.connectionId!, threadId: didcommThreadId })
  }

  const footer: Record<CallOfferState, React.ReactElement> = {
    [CallOfferState.RECEIVED]: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton text={t('general.refuse')} onPress={reject} style={styles.refuseButton} />
        <BlueButton text={t('call.joinCall')} onPress={join} style={styles.joinButton} />
      </View>
    ),
    [CallOfferState.FINISHED]: <State text={t('call.callEnded')} />,
    [CallOfferState.REJECTED]: <State text={t('call.callRejected')} type="error" />,
    [CallOfferState.EXPIRED]: (
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
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {description ?? t('chat.callOfferDescription', { sender: sender?.name })}
        </Text>
        {footer[callState]}
      </View>
    </View>
  )
}

export default CallOfferChatView
