import { Text } from '@src/components/common'
import { useChat, useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@src/hooks/providers/useVideoCallContext'
import { CallOfferState, ChatEntryRole } from '@src/model'
import { isNowAfterThanDate } from '@src/utils/dateUtils'
import { toast } from '@src/utils/toast'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { BlueButton, Header, OutlinedBlueButton, State } from '../components'
import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

const CallOfferChatView = ({ metadata, didcommThreadId, role }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { joinCall } = useVideoCallContext()
  const { chatThread } = useChat()
  const { description, state, offerExpirationTime } = metadata
  const [callState, setCallState] = useState<CallOfferState>(state)
  const connectionId = chatThread?.data?.connectionId
  const sender = chatThread?.participants.find((p) => p.id === role)
  const receiver = chatThread?.participants.find((p) => p.id !== role)

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
      if (!connectionId) return
      joinCall(connectionId, callType, { roomId, peerId, wsUrl }, didcommThreadId)
    }
  }

  const reject = () => {
    if (!connectionId) return
    agent?.modules.calls.reject({ connectionId, threadId: didcommThreadId })
  }

  const footer: Record<CallOfferState, React.ReactElement> = {
    [CallOfferState.RECEIVED]: (
      <View style={styles.buttonsContainer}>
        {role === ChatEntryRole.Receiver && (
          <OutlinedBlueButton text={t('general.refuse')} onPress={reject} style={styles.refuseButton} />
        )}
        <BlueButton text={t('call.joinCall')} onPress={join} style={styles.joinButton} />
      </View>
    ),
    [CallOfferState.FINISHED]: <State text={t('call.callEnded')} />,
    [CallOfferState.REJECTED]: <State text={t('call.callRejected')} type="error" />,
    [CallOfferState.EXPIRED]: (
      <View style={styles.expiredContainer}>
        <Text fontFamily="EuclidCircularA-Bold" style={styles.expiredText}>
          {t('call.expiredCall')}
        </Text>
      </View>
    ),
  }
  const getMainText = () => {
    if (description) return description
    if (role === ChatEntryRole.Receiver) return t('chat.callOfferDescription', { sender: sender?.name })
    return t('chat.sentCallOfferDescription', { receiver: receiver?.name })
  }

  return (
    <View style={styles.container}>
      <Header theme={theme} title={t('preview.callOffer')} leftIconName="incomingCall" />
      <View style={styles.subContainer}>
        <Text style={styles.title}>{getMainText()}</Text>
        {footer[callState]}
      </View>
    </View>
  )
}

export default CallOfferChatView
