import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import { Props } from './CallOfferChatViewProps'
import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { updateMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import { CallOfferState } from '@2060/model'
import { isNowAfterThanDate } from '@2060/utils/dateUtils'
import { toast } from '@2060/utils/toast'

const CallOfferChatView = ({ id, metadata, sender, didcommThreadId }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { joinCall } = useVideoCallContext()
  const { chatThread } = useChat()
  const { realm } = useLocalRealm()
  const { description, state, offerExpirationTime } = metadata

  useEffect(() => {
    if (!realm || state !== CallOfferState.RECEIVED || !offerExpirationTime) return
    const isExpired = isNowAfterThanDate(offerExpirationTime)
    if (isExpired) {
      updateMetadata(realm, id, {
        ...metadata,
        state: CallOfferState.EXPIRED,
      })
    }
  }, [])

  const join = () => {
    const canJoin = offerExpirationTime ? !isNowAfterThanDate(offerExpirationTime) : true
    if (canJoin) {
      const { callType, roomId, peerId, wsUrl } = metadata
      joinCall(chatThread?.data.connectionId!, callType, { roomId, peerId, wsUrl })
    } else {
      toast({ type: 'error', message: t('chat.expiredCallMessage'), duration: 3000 })
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
        {footer[state]}
      </View>
    </View>
  )
}

export default CallOfferChatView
