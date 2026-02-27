import { QuestionAnswerRecord, QuestionAnswerState } from '@credo-ts/question-answer'
import Realm from 'realm'

import { createChatEntry } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'

import { AnswerMetadata, ChatEntryRole, ChatEntryState, ChatEntryType, QuestionMetadata } from '@src/model'
import { MobileAgent } from '@src/services/agent'

export const handleQuestionAnswerRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: QuestionAnswerRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record: questionAnswerRecord, activeChatThreadId } = options
  // Find associated thread according to the connection id. If not found, create it
  const connection = await agent.didcomm.connections.getById(questionAnswerRecord.connectionId)
  const thread = findOrCreateChatThread(realm, connection)

  const recordState = questionAnswerRecord.state

  if (recordState === QuestionAnswerState.QuestionReceived) {
    const metadata: QuestionMetadata = {
      text: questionAnswerRecord.questionText,
      description: questionAnswerRecord.questionDetail,
      options: JSON.stringify(questionAnswerRecord.validResponses.map(({ text }) => ({ text, value: text }))),
    }
    createChatEntry(realm, {
      associatedRecordId: questionAnswerRecord.id,
      associatedMessageId: questionAnswerRecord.threadId,
      chatThreadId: thread.id,
      type: ChatEntryType.Question,
      role: ChatEntryRole.Receiver,
      state: ChatEntryState.Received,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
    })
    if (thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  } else if (recordState === QuestionAnswerState.AnswerReceived) {
    const metadata: AnswerMetadata = { response: questionAnswerRecord.response ?? '' }
    createChatEntry(realm, {
      associatedRecordId: questionAnswerRecord.id,
      chatThreadId: thread.id,
      type: ChatEntryType.Answer,
      role: ChatEntryRole.Receiver,
      state: ChatEntryState.Received,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
    })
    if (thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  } else if (recordState === QuestionAnswerState.QuestionSent) {
    const metadata: QuestionMetadata = {
      text: questionAnswerRecord.questionText,
      description: questionAnswerRecord.questionDetail,
      options: JSON.stringify(questionAnswerRecord.validResponses.map(({ text }) => ({ text, value: text }))),
    }
    createChatEntry(realm, {
      associatedRecordId: questionAnswerRecord.id,
      associatedMessageId: questionAnswerRecord.threadId,
      chatThreadId: thread.id,
      type: ChatEntryType.Question,
      role: ChatEntryRole.Sender,
      state: ChatEntryState.Created,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
    })
  }
}
