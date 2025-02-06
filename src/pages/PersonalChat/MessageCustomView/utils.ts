import dayjs from 'dayjs'

import { ChatEntryData, ChatEntryRole } from '@2060/model'

type MustDisplayProps = {
  messageTime: string
  chatEntry: ChatEntryData
  nextMessageChatEntry?: ChatEntryData
  timeFormat: string
}

const mustDisplayAckAndTime = ({
  messageTime,
  chatEntry,
  nextMessageChatEntry,
  timeFormat,
}: MustDisplayProps) => {
  const nextMessageHasDifferentRole = chatEntry.role !== nextMessageChatEntry?.role
  if (nextMessageHasDifferentRole) return true
  const nextMessageTime = dayjs(nextMessageChatEntry?.createdAt).format(timeFormat)
  if (chatEntry.role === ChatEntryRole.Sender) {
    const nextSentMessageHasDifferentTime = nextMessageTime !== messageTime
    const nextSentMessageHasDifferentState = nextMessageChatEntry?.state !== chatEntry.state
    if (nextSentMessageHasDifferentTime || nextSentMessageHasDifferentState) return true
    return false
  } else {
    return messageTime !== nextMessageTime
  }
}

export const ROUND_BORDER = 9
const SQUARE_BORDER = 0

type GetMessagesBordersProps = {
  chatEntry: ChatEntryData
  prevMessageChatEntry?: ChatEntryData
  nextMessageChatEntry?: ChatEntryData
}

const getMessageBorders = (props: GetMessagesBordersProps) => {
  return props.chatEntry.role === ChatEntryRole.Sender
    ? getBordersForSentMessage(props)
    : getBordersForReceivedMessage(props)
}

const commonBorderRadiusForSentMessage = {
  borderTopLeftRadius: ROUND_BORDER,
  borderBottomLeftRadius: ROUND_BORDER,
}

const getBordersForSentMessage = ({
  prevMessageChatEntry,
  chatEntry,
  nextMessageChatEntry,
}: GetMessagesBordersProps) => {
  const nextMessageHasSameRole = chatEntry.role === nextMessageChatEntry?.role
  const previousMessageHasSameRole = chatEntry.role === prevMessageChatEntry?.role
  const isMessageBetweenGroupOfMessages = previousMessageHasSameRole && nextMessageHasSameRole
  if (isMessageBetweenGroupOfMessages) {
    return {
      ...commonBorderRadiusForSentMessage,
      borderTopRightRadius: SQUARE_BORDER,
      borderBottomRightRadius: SQUARE_BORDER,
    }
  }

  const previousMessageHasDifferentRole = chatEntry.role !== prevMessageChatEntry?.role
  const isFirstMessageInGroupOfMessages = previousMessageHasDifferentRole && nextMessageHasSameRole
  if (isFirstMessageInGroupOfMessages) {
    return {
      ...commonBorderRadiusForSentMessage,
      borderTopRightRadius: ROUND_BORDER,
      borderBottomRightRadius: SQUARE_BORDER,
    }
  }

  const nextMessageHasDifferentRole = chatEntry.role !== nextMessageChatEntry?.role
  const isLastMessageInGroupOfMessages = previousMessageHasSameRole && nextMessageHasDifferentRole
  if (isLastMessageInGroupOfMessages) {
    return {
      ...commonBorderRadiusForSentMessage,
      borderTopRightRadius: SQUARE_BORDER,
      borderBottomRightRadius: ROUND_BORDER,
    }
  }

  return {
    ...commonBorderRadiusForSentMessage,
    borderTopRightRadius: ROUND_BORDER,
    borderBottomRightRadius: ROUND_BORDER,
  }
}

const commonBorderRadiusForReceivedMessage = {
  borderTopRightRadius: ROUND_BORDER,
  borderBottomRightRadius: ROUND_BORDER,
}

const getBordersForReceivedMessage = ({
  prevMessageChatEntry,
  chatEntry,
  nextMessageChatEntry,
}: GetMessagesBordersProps) => {
  const previousMessageHasSameRole = chatEntry.role === prevMessageChatEntry?.role
  const nextMessageHasSameRole = chatEntry.role === nextMessageChatEntry?.role
  const isMessageBetweenGroupOfMessages = previousMessageHasSameRole && nextMessageHasSameRole
  if (isMessageBetweenGroupOfMessages) {
    return {
      borderTopLeftRadius: SQUARE_BORDER,
      borderBottomLeftRadius: SQUARE_BORDER,
      ...commonBorderRadiusForReceivedMessage,
    }
  }

  const previousMessageHasDifferentRole = chatEntry.role !== prevMessageChatEntry?.role
  const isFirstMessageInGroupOfMessages = previousMessageHasDifferentRole && nextMessageHasSameRole
  if (isFirstMessageInGroupOfMessages) {
    return {
      borderTopLeftRadius: ROUND_BORDER,
      borderBottomLeftRadius: SQUARE_BORDER,
      ...commonBorderRadiusForReceivedMessage,
    }
  }

  const nextMessageHasDifferentRole = chatEntry.role !== nextMessageChatEntry?.role
  const isLastMessageInGroupOfMessages = previousMessageHasSameRole && nextMessageHasDifferentRole
  if (isLastMessageInGroupOfMessages) {
    return {
      borderTopLeftRadius: SQUARE_BORDER,
      borderBottomLeftRadius: ROUND_BORDER,
      ...commonBorderRadiusForReceivedMessage,
    }
  }

  return {
    borderTopLeftRadius: ROUND_BORDER,
    borderBottomLeftRadius: ROUND_BORDER,
    ...commonBorderRadiusForReceivedMessage,
  }
}

export { mustDisplayAckAndTime, getMessageBorders }
