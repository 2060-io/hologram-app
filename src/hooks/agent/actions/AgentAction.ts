export enum ActionExecutionStatus {
  OK = 'ok',
  Failed = 'failed',
}

export type OutboundMessageContextData = {
  message: Record<string, unknown>
  associatedChatEntryId?: string
  associatedRecord?: { id: string; type: string }
  didcommConnectionId?: string
}

export enum AgentActionType {
  SendTextMessage = 'SendTextMessage',
  ShareMedia = 'ShareMedia',
  SendReaction = 'SendReaction',
  SendReceipts = 'SendReceipts',
  ActionMenuSelection = 'ActionMenuSelection',
  ForwardConnection = 'ForwardConnection',
  PresentCredential = 'PresentCredential',
}

export type AgentAction = {
  type: AgentActionType
  parameters: Record<string, unknown>
  chatEntryId?: string
  attempts: number
}

export type AgentActionOptions = Omit<AgentAction, 'attempts'>

export type RetryAgentAction = {
  outboundMessageContextData: OutboundMessageContextData
  remainingAttempts: number
}
