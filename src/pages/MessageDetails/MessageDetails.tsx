import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { uses24HourClock } from 'react-native-localize'

import { FloatingChatMessage } from '../PersonalChat/MessageCustomView'

import getStyles from './styles'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { Avatar, Text } from '@2060/components/common'
import { useChat, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryState } from '@2060/model'
import { getFormattedDateRangeWithTime } from '@2060/utils/dateUtils'

interface Props extends StackScreenProps<PersonalChatStackParams, 'MessageDetails'> {}

const MessageDetails = ({ route }: Props) => {
  const { selectedMessage } = route.params
  const { agent } = useMobileAgent()
  const using24HourFormat = uses24HourClock()
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { chatThread } = useChat()
  const userSender = chatThread?.participants.find(p => p.id === selectedMessage.role)
  const receivedReceipt = selectedMessage.receipts.find(receipt => receipt.state === ChatEntryState.Received)
  const viewedReceipt = selectedMessage.receipts.find(receipt => receipt.state === ChatEntryState.Viewed)

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
        <Text style={styles.infoText}>
          {`${t('personalChat.sent')} ${getTransformedDate(selectedMessage.createdAt)}`}
        </Text>
        {receivedReceipt && (
          <Text style={styles.infoText}>
            {`${t('personalChat.received')} ${getTransformedDate(receivedReceipt.timestamp)}`}
          </Text>
        )}
        {viewedReceipt && (
          <Text style={styles.infoText}>
            {`${t('personalChat.read')} ${getTransformedDate(viewedReceipt.timestamp)}`}
          </Text>
        )}
      </View>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.sentByText}>
        {t('personalChat.sentBy')}
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
