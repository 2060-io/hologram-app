import { QuestionMetadata } from '@src/model'

export interface QuestionChatViewProps {
  question: QuestionMetadata
  associatedRecordId: string
}

export type QuestionAnswerOption = {
  text: string
  value: string
}
