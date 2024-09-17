import { QuestionAnswerRecord, QuestionAnswerState } from '@credo-ts/question-answer'
import Realm from 'realm'

import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import {
  AnswerMetadata,
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  QuestionMetadata,
} from '@2060/model'
import { MobileAgent } from '@2060/services/agent'

export const handleQuestionAnswerRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: QuestionAnswerRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record: questionAnswerRecord, activeChatThreadId } = options
  // Find associated thread according to the connection id. If not found, create it
  const connection = await agent.connections.getById(questionAnswerRecord.connectionId)
  const thread = chatThreadService.findOrCreateChatThread(realm, connection)

  const recordState = questionAnswerRecord.state

  let chatEntry: ChatEntry | undefined
  if (recordState === QuestionAnswerState.QuestionReceived) {
    const metadata: QuestionMetadata = {
      text: questionAnswerRecord.questionText,
      description: questionAnswerRecord.questionDetail,
      options: JSON.stringify(questionAnswerRecord.validResponses.map(({ text }) => ({ text, value: text }))),
    }
    chatEntry = chatEntryService.createChatEntry(realm, {
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
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  } else if (recordState === QuestionAnswerState.AnswerSent) {
    const metadata: AnswerMetadata = { response: questionAnswerRecord.response ?? '' }
    chatEntry = chatEntryService.createChatEntry(realm, {
      associatedRecordId: questionAnswerRecord.id,
      chatThreadId: thread.id,
      type: ChatEntryType.Answer,
      role: ChatEntryRole.Sender,
      state: ChatEntryState.Created,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
    })

    // Find any Question entry associated to this question-answer record and mark it as replied
    const [questionEntry] = chatEntryService.findAllByAssociatedRecordId(
      realm,
      questionAnswerRecord.id,
      ChatEntryType.Question,
    )

    if (questionEntry) {
      const questionMetadata = {
        ...questionEntry.metadata,
        response: questionAnswerRecord.response ?? '',
      }
      chatEntryService.updateMetadata(realm, questionEntry.id, questionMetadata)
    }
  } else if (recordState === QuestionAnswerState.AnswerReceived) {
    const metadata: AnswerMetadata = { response: questionAnswerRecord.response ?? '' }
    chatEntry = chatEntryService.createChatEntry(realm, {
      associatedRecordId: questionAnswerRecord.id,
      chatThreadId: thread.id,
      type: ChatEntryType.Answer,
      role: ChatEntryRole.Receiver,
      state: ChatEntryState.Received,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
    })
    if (thread.id !== activeChatThreadId) {
      chatThreadService.addUnread(realm, thread.id, 1)
    }
  } else if (recordState === QuestionAnswerState.QuestionSent) {
    const metadata: QuestionMetadata = {
      text: questionAnswerRecord.questionText,
      description: questionAnswerRecord.questionDetail,
      options: JSON.stringify(questionAnswerRecord.validResponses.map(({ text }) => ({ text, value: text }))),
    }
    chatEntry = chatEntryService.createChatEntry(realm, {
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

  chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
}
