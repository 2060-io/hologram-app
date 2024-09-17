import { AgentMessage, parseMessageType } from '@credo-ts/core'
import { Expose, Transform, TransformationType, Type } from 'class-transformer'
import { IsArray, IsEnum, IsString, IsDate, IsInstance, ValidateNested } from 'class-validator'

export enum MessageReactionAction {
  React = 'react',
  Unreact = 'unreact',
}

export interface MessageReactionOptions {
  messageId: string
  emoji: string
  action: MessageReactionAction
  timestamp?: Date
}
export class MessageReaction {
  public constructor(options: MessageReactionOptions) {
    if (options) {
      this.messageId = options.messageId
      this.action = options.action
      this.emoji = options.emoji
      this.timestamp = options.timestamp ?? new Date()
    }
  }

  @Expose({ name: 'message_id' })
  @IsString()
  public messageId!: string

  @IsString()
  public emoji!: string

  @IsEnum(MessageReactionAction)
  public action!: string

  @Transform(({ value, type }) => {
    if (type === TransformationType.CLASS_TO_PLAIN) {
      return Math.floor(value.getTime() / 1000)
    }

    if (type === TransformationType.PLAIN_TO_CLASS) {
      return new Date(value * 1000)
    }
  })
  @IsDate()
  public timestamp!: Date
}

export interface MessageReactionsMessageOptions {
  id?: string
  reactions: MessageReaction[]
}

export class MessageReactionsMessage extends AgentMessage {
  public constructor(options: MessageReactionsMessageOptions) {
    super()

    if (options) {
      this.id = options.id ?? this.generateId()
      this.reactions = options.reactions
    }
  }

  @Type(() => MessageReaction)
  @IsArray()
  @ValidateNested()
  @IsInstance(MessageReaction, { each: true })
  public reactions!: MessageReaction[]

  //@IsValidMessageType(CallAcceptMessage.type)
  public static readonly type = parseMessageType('https://didcomm.org/reactions/1.0/message-reactions')
  public readonly type = MessageReactionsMessage.type.messageTypeUri
}
