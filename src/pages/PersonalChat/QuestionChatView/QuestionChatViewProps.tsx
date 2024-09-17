import { QuestionMetadata } from '@2060/model'

export interface QuestionChatViewProps {
  question: QuestionMetadata
  associatedRecordId: string
}

export type QuestionAnswerOption = {
  text: string
  value: string
}
