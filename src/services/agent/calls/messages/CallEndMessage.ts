import { AgentMessage, parseMessageType } from '@credo-ts/core'

interface CallEndMessageOptions {
  id?: string
  threadId?: string
}

export class CallEndMessage extends AgentMessage {
  public constructor(options: CallEndMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.setThread({ threadId: options.threadId })
    }
  }

  public parameters!: Record<string, unknown>

  //@IsValidMessageType(CallEndMessage.type)
  public static readonly type = parseMessageType('https://didcomm.org/calls/1.0/call-end')
  public readonly type = CallEndMessage.type.messageTypeUri
}
