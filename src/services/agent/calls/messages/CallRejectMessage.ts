import { AgentMessage, parseMessageType } from '@credo-ts/core'

interface CallRejectMessageOptions {
  id?: string
  threadId?: string
}

export class CallRejectMessage extends AgentMessage {
  public constructor(options: CallRejectMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.setThread({ threadId: options.threadId })
    }
  }

  public parameters!: Record<string, unknown>

  //@IsValidMessageType(CallRejectMessage.type)
  public static readonly type = parseMessageType('https://didcomm.org/calls/1.0/call-reject')
  public readonly type = CallRejectMessage.type.messageTypeUri
}
