import { AgentMessage, parseMessageType } from '@credo-ts/core'

interface CallAcceptMessageOptions {
  id?: string
  threadId?: string
  parameters: Record<string, unknown>
}

export class CallAcceptMessage extends AgentMessage {
  public constructor(options: CallAcceptMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.parameters = options.parameters
      this.setThread({ threadId: options.threadId })
    }
  }

  public parameters!: Record<string, unknown>

  //@IsValidMessageType(CallAcceptMessage.type)
  public static readonly type = parseMessageType('https://didcomm.org/calls/1.0/call-accept')
  public readonly type = CallAcceptMessage.type.messageTypeUri
}
