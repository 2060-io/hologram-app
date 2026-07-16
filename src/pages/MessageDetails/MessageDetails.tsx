import { StackScreenProps } from '@react-navigation/stack'
import { Avatar, Text } from '@src/components/common'
import { ChatStackParams } from '@src/components/Navigation/NavigationProps'
import { useChat, useMobileAgent } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryState } from '@src/model'
import { getFormattedDateRangeWithTime } from '@src/utils/dateUtils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { uses24HourClock } from 'react-native-localize'
import { FloatingChatMessage } from '../Chat/MessageCustomView'
import getStyles from './styles'

type Props = StackScreenProps<ChatStackParams, 'MessageDetails'>

const MessageDetails = ({ route }: Props) => {
  const { selectedMessage } = route.params
  const { agent } = useMobileAgent()
  const using24HourFormat = uses24HourClock()
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { chatThread } = useChat()
  const userSender = chatThread?.participants.find((p) => p.id === selectedMessage.role)
  const receivedReceipt = selectedMessage.receipts.find((receipt) => receipt.state === ChatEntryState.Received)
  const viewedReceipt = selectedMessage.receipts.find((receipt) => receipt.state === ChatEntryState.Viewed)

  const getTransformedDate = (date: number) => {
    return getFormattedDateRangeWithTime(new Date(date), using24HourFormat)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.infoContainer}>
        <View style={styles.messageContainer}>
          <FloatingChatMessage
            currentMessage={selectedMessage}
            agent={agent}
            supportsMessageReceipts={Boolean(chatThread?.flags.supportsMessageReceipts)}
            using24HourFormat={using24HourFormat}
            onTouchRepliedMessage={() => {}}
            renderCustomHeader={() => <></>}
          />
        </View>
        <Text style={styles.infoText}>{`${t('chat.sent')} ${getTransformedDate(selectedMessage.createdAt)}`}</Text>
        {receivedReceipt && (
          <Text style={styles.infoText}>
            {`${t('chat.received')} ${getTransformedDate(receivedReceipt.timestamp)}`}
          </Text>
        )}
        {viewedReceipt && (
          <Text style={styles.infoText}>{`${t('chat.read')} ${getTransformedDate(viewedReceipt.timestamp)}`}</Text>
        )}
      </View>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.sentByText}>
        {t('chat.sentBy')}
      </Text>
      <View style={styles.senderContainer}>
        <Avatar
          uri={userSender?.avatar}
          label={userSender?.name}
          size="8.41%"
          bgAvatarInitials={theme.colors.secondary}
        />
        <Text fontFamily="EuclidCircularA-Medium" style={styles.senderText}>
          {userSender?.name}
        </Text>
      </View>
    </ScrollView>
  )
}

export default MessageDetails
