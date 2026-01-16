import { CallEndMessage, CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import { ShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { ProfileMessage, RequestProfileMessage } from '@2060.io/credo-ts-didcomm-user-profile'
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
  V2PresentationMessage,
  V2RequestPresentationMessage,
  ProofState,
  ProofStateChangedEvent,
  ProofEventTypes,
  AutoAcceptProof,
  HangupMessage,
  OutOfBandRole,
} from '@credo-ts/core'
import { PushNotificationsFcmSetDeviceInfoMessage } from '@credo-ts/push-notifications'
import { AnswerMessage } from '@credo-ts/question-answer'
import { Platform } from 'react-native'

import { AgentAction, AgentActionType } from './AgentAction'
import {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  AcceptCredentialOfferParameters,
  AcceptProofProposalParameters,
  AcceptProofRequestParameters,
  CreateCallOfferParameters,
  DeclineCredentialOfferParameters,
  DeclineProofRequestParameters,
  DeleteConnectionParameters,
  ForwardConnectionParameters,
  HangupCallParameters,
  MenuSelectionParameters,
  PresentCredentialParameters,
  ProofSendProblemReportParameters,
  QueryServiceFeaturesParameters,
  RemoveOutOfBandRecordParameters,
  RequestUserProfileParameters,
  SavePushNotificationDeviceInfoParameters,
  SendAnswerParameters,
  SendReactionParameters,
  SendReceiptsParameters,
  SendTextMessageParameters,
  SendUserProfileParameters,
  ShareMediaParameters,
} from './types'

import { createOobInvitation, MobileAgent } from '@2060/services/agent'

type AgentCallbackReturnType<T extends BaseRecord = BaseRecord> = {
  associatedRecord?: T
  outgoingMessageType: string
}
type ActionCallback = (options: { agent: MobileAgent }) => Promise<AgentCallbackReturnType<BaseRecord>>
type ActionFactory = (action: AgentAction) => ActionCallback

export const AgentActionExecuterMap: Record<AgentActionType, ActionFactory> = {
  [AgentActionType.SendTextMessage]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendTextMessageParameters
      const { connectionId, message, parentThreadId } = parameters
      const record = await options.agent.basicMessages.sendMessage(connectionId, message, parentThreadId)
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
      await options.agent.credentials.declineOffer(parameters.credentialRecordId, {
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      return { outgoingMessageType: V2CredentialProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.DeclineProofRequest]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineProofRequestParameters
      const { proofRecordId } = parameters
      await options.agent.proofs.declineRequest({ proofRecordId, sendProblemReport: true })
      return { outgoingMessageType: V2PresentationProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.SendUserProfile]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendUserProfileParameters
      await options.agent.modules.profile.sendUserProfile(parameters)
      return { outgoingMessageType: ProfileMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.RequestUserProfile]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as RequestUserProfileParameters
      const { connectionId } = parameters
      await options.agent.modules.profile.requestUserProfile({ connectionId })
      return { outgoingMessageType: RequestProfileMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptProofRequest]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofRequestParameters
      const { proofRecordId } = parameters
      const requestedCredentials = await options.agent.proofs.selectCredentialsForRequest({
        proofRecordId,
      })
      await options.agent.proofs.acceptRequest({
        proofRecordId,
        proofFormats: { anoncreds: requestedCredentials?.proofFormats.anoncreds },
      })
      return { outgoingMessageType: V2PresentationMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptProofProposal]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofProposalParameters
      const { proofRecordId } = parameters
      await options.agent.proofs.acceptProposal({
        proofRecordId,
        autoAcceptProof: AutoAcceptProof.ContentApproved,
      })
      return { outgoingMessageType: V2RequestPresentationMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.ProofSendProblemReport]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ProofSendProblemReportParameters
      const { proofRecordId, description } = parameters
      const proofRecord = await options.agent.proofs.getById(proofRecordId)
      await options.agent.proofs.sendProblemReport({ proofRecordId, description })
      proofRecord.state = ProofState.Abandoned
      await options.agent.proofs.update(proofRecord)
      options.agent.events.emit<ProofStateChangedEvent>(options.agent.context, {
        type: ProofEventTypes.ProofStateChanged,
        payload: {
          proofRecord: proofRecord.clone(),
          previousState: null,
        },
      })
      return { outgoingMessageType: V2PresentationProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.SavePushNotificationDeviceInfo]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SavePushNotificationDeviceInfoParameters
      const { connectionId, deviceToken } = parameters
      await options.agent.modules.pushNotifications.setDeviceInfo(connectionId, {
        deviceToken,
        devicePlatform: Platform.OS,
      })
      return { outgoingMessageType: PushNotificationsFcmSetDeviceInfoMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.DeleteConnection]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeleteConnectionParameters
      const { connectionId, outOfBandRecordId } = parameters
      await options.agent.connections.hangup({ connectionId, deleteAfterHangup: true })
      // Once the connection has been eliminated, delete its associated OOB record (only if we were invited
      // as the OOB record can be still valid for invitations we have created)
      if (outOfBandRecordId) {
        const outOfBandRecord = await options.agent.oob.findById(outOfBandRecordId)
        if (outOfBandRecord?.role === OutOfBandRole.Receiver) {
          await options.agent.oob.deleteById(outOfBandRecordId)
        }
      }
      return { outgoingMessageType: HangupMessage.type.messageTypeUri }
    }
  },
}
