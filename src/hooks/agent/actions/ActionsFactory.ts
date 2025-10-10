import { CallEndMessage, CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import { ShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { PerformMessage } from '@credo-ts/action-menu'
import {
  BasicMessage,
  MessageSender,
  OutboundMessageContext,
  OutOfBandInvitation,
  V2ProposePresentationMessage,
  DidExchangeResponseMessage,
  DidExchangeCompleteMessage,
  DiscoverFeaturesApi,
  V2QueriesMessage,
  KeylistUpdateMessage,
  AutoAcceptCredential,
  V2RequestCredentialMessage,
  V2CredentialProblemReportMessage,
  V2PresentationProblemReportMessage,
  BaseRecord,
} from '@credo-ts/core'
import { AnswerMessage } from '@credo-ts/question-answer'

import { AgentAction, AgentActionType } from './AgentAction'
import {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  AcceptCredentialOfferParameters,
  CreateCallOfferParameters,
  DeclineCredentialOfferParameters,
  ForwardConnectionParameters,
  HangupCallParameters,
  MenuSelectionParameters,
  PresentCredentialParameters,
  QueryServiceFeaturesParameters,
  RemoveOutOfBandRecordParameters,
  SendAnswerParameters,
  SendReactionParameters,
  SendReceiptsParameters,
  SendTextMessageParameters,
  ShareMediaParameters,
} from './types'

import { createOobInvitation, MobileAgent } from '@2060/services/agent'

type AgentCallbackReturnType<T extends BaseRecord = BaseRecord> = {
  associatedRecord?: T
  outgoingMessageType: string
}
type ActionCallback = (options: { agent: MobileAgent }) => Promise<AgentCallbackReturnType<BaseRecord>>
type ActionFactory = (action: AgentAction) => ActionCallback

export const ACTION_FACTORIES: Record<AgentActionType, ActionFactory> = {
  [AgentActionType.SendTextMessage]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendTextMessageParameters
      const { didcommConnectionId, message, didcommThreadId } = parameters
      const record = await options.agent.basicMessages.sendMessage(
        didcommConnectionId,
        message,
        didcommThreadId,
      )
      return {
        associatedRecord: record,
        outgoingMessageType: BasicMessage.type.messageTypeUri,
      }
    }
  },
  [AgentActionType.SendReaction]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendReactionParameters
      await options.agent.modules.reactions.send(parameters)
      return { outgoingMessageType: MessageReactionsMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.SendReceipts]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendReceiptsParameters
      const { connectionId, receipts } = parameters
      await options.agent.modules.receipts.send({
        connectionId,
        receipts: receipts.map(item => ({
          messageId: item.messageId,
          state: item.state,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        })),
      })
      return { outgoingMessageType: MessageReceiptsMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.ShareMedia]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ShareMediaParameters
      const { recordId } = parameters
      await options.agent.modules.media.share({ recordId })
      return { outgoingMessageType: ShareMediaMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.MenuSelection]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as MenuSelectionParameters
      const { connectionId, selectedItemName } = parameters
      await options.agent.modules.actionMenu.performAction({
        connectionId,
        performedAction: { name: selectedItemName },
      })
      return { outgoingMessageType: PerformMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.ForwardConnection]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ForwardConnectionParameters
      const { forwarderConnectionId, connectionId } = parameters
      const originDidcommConnection = await options.agent?.connections.getById(forwarderConnectionId)
      const outOfBandInvitation = createOobInvitation(originDidcommConnection)
      const connection = await options.agent?.connections.getById(connectionId)
      const messageSender = options.agent?.context.dependencyManager.resolve(MessageSender)
      await messageSender.sendMessage(
        new OutboundMessageContext(outOfBandInvitation, {
          agentContext: options.agent?.context,
          connection,
        }),
      )
      return { outgoingMessageType: OutOfBandInvitation.type.messageTypeUri }
    }
  },
  [AgentActionType.PresentCredential]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as PresentCredentialParameters
      const { connectionId, anoncredsAttributes } = parameters
      const proofExchangeRecord = await options.agent.proofs.proposeProof({
        proofFormats: { anoncreds: { attributes: anoncredsAttributes } },
        connectionId,
        protocolVersion: 'v2',
      })
      return {
        outgoingMessageType: V2ProposePresentationMessage.type.messageTypeUri,
        associatedRecord: proofExchangeRecord,
      }
    }
  },
  [AgentActionType.SendAnswer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendAnswerParameters
      const { response, questionRecordId } = parameters
      const associatedRecord = await options.agent.modules.questionAnswer.sendAnswer(
        questionRecordId,
        response,
      )
      return {
        outgoingMessageType: AnswerMessage.type.messageTypeUri,
        associatedRecord,
      }
    }
  },
  [AgentActionType.AcceptConnectionRequest]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptConnectionRequestParameters
      const { connectionId } = parameters
      await options.agent.connections.acceptRequest(connectionId)
      return { outgoingMessageType: DidExchangeResponseMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptConnectionResponse]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptConnectionResponseParameters
      const { connectionId } = parameters
      await options.agent.connections.acceptResponse(connectionId)
      return { outgoingMessageType: DidExchangeCompleteMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.QueryServiceFeatures]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as QueryServiceFeaturesParameters
      const { connectionId } = parameters
      const discoverFeaturesApi = options.agent.context.dependencyManager.resolve(DiscoverFeaturesApi)
      await discoverFeaturesApi.queryFeatures({
        protocolVersion: 'v2',
        queries: [
          { featureType: 'protocol', match: 'https://didcomm.org/media-sharing/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/reactions/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/receipts/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/user-profile/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/calls/1.0' },
        ],
        connectionId,
      })
      return { outgoingMessageType: V2QueriesMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.CreateCallOffer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as CreateCallOfferParameters
      const { callType, connectionId, callInfo } = parameters
      await options.agent.modules.calls.offer({
        connectionId,
        callType,
        parameters: { ...callInfo },
      })
      return { outgoingMessageType: CallOfferMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.HangupCall]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as HangupCallParameters
      await options.agent.modules.calls.hangup(parameters)
      return { outgoingMessageType: CallEndMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.RemoveOutOfBandRecord]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as RemoveOutOfBandRecordParameters
      await options.agent.oob.deleteById(parameters.outOfBandId)
      return { outgoingMessageType: KeylistUpdateMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptCredentialOffer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptCredentialOfferParameters
      const { credentialRecordId } = parameters
      await options.agent.credentials.acceptOffer({
        credentialRecordId,
        autoAcceptCredential: AutoAcceptCredential.ContentApproved,
      })
      return { outgoingMessageType: V2RequestCredentialMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.DeclineCredentialOffer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineCredentialOfferParameters
      const { credentialRecordId } = parameters
      await options.agent.credentials.declineOffer(credentialRecordId, {
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      return { outgoingMessageType: V2CredentialProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.DeclineProofRequest]: action => {
    const parameters = action.parameters as { proofRecordId: string }
    const { proofRecordId } = parameters
    return async (options: { agent: MobileAgent }) => {
      await options.agent.proofs.declineRequest({ proofRecordId, sendProblemReport: true })
      return { outgoingMessageType: V2PresentationProblemReportMessage.type.messageTypeUri }
    }
  },
}
