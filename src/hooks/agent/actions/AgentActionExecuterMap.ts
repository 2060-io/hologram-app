import { CallEndMessage, CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommMessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { DidCommProfileMessage, DidCommRequestProfileMessage } from '@2060.io/credo-ts-didcomm-user-profile'
import { PerformMessage } from '@credo-ts/action-menu'
import { BaseRecord } from '@credo-ts/core'
import {
  DidCommBasicMessage,
  DidCommMessageSender,
  DidCommOutboundMessageContext,
  DidCommOutOfBandInvitation,
  DidCommProposePresentationV2Message,
  DidCommDidExchangeResponseMessage,
  DidCommDidExchangeCompleteMessage,
  DidCommDiscoverFeaturesApi,
  DidCommKeylistUpdateMessage,
  DidCommAutoAcceptCredential,
  DidCommRequestCredentialV2Message,
  DidCommCredentialV2ProblemReportMessage,
  DidCommPresentationV2ProblemReportMessage,
  DidCommPresentationV2Message,
  DidCommRequestPresentationV2Message,
  DidCommProofState,
  DidCommProofStateChangedEvent,
  DidCommProofEventTypes,
  DidCommAutoAcceptProof,
  DidCommFeaturesQueriesMessage,
} from '@credo-ts/didcomm'
import { DidCommPushNotificationsFcmSetDeviceInfoMessage } from '@credo-ts/didcomm-push-notifications'
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
      const record = await options.agent.didcomm.basicMessages.sendMessage(
        connectionId,
        message,
        parentThreadId,
      )
      return {
        associatedRecord: record,
        outgoingMessageType: DidCommBasicMessage.type.messageTypeUri,
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
      return { outgoingMessageType: DidCommMessageReceiptsMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.ShareMedia]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ShareMediaParameters
      const { recordId } = parameters
      await options.agent.modules.media.share({ recordId })
      return { outgoingMessageType: DidCommShareMediaMessage.type.messageTypeUri }
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
      const originDidcommConnection = await options.agent?.didcomm.connections.getById(forwarderConnectionId)
      const outOfBandInvitation = createOobInvitation(originDidcommConnection)
      const connection = await options.agent?.didcomm.connections.getById(connectionId)
      const messageSender = options.agent?.context.dependencyManager.resolve(DidCommMessageSender)
      await messageSender.sendMessage(
        new DidCommOutboundMessageContext(outOfBandInvitation, {
          agentContext: options.agent?.context,
          connection,
        }),
      )
      return { outgoingMessageType: DidCommOutOfBandInvitation.type.messageTypeUri }
    }
  },
  [AgentActionType.PresentCredential]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as PresentCredentialParameters
      const { connectionId, anoncredsAttributes } = parameters
      const proofExchangeRecord = await options.agent.didcomm.proofs.proposeProof({
        proofFormats: { anoncreds: { attributes: anoncredsAttributes } },
        connectionId,
        protocolVersion: 'v2',
      })
      return {
        outgoingMessageType: DidCommProposePresentationV2Message.type.messageTypeUri,
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
      await options.agent.didcomm.connections.acceptRequest(connectionId)
      return { outgoingMessageType: DidCommDidExchangeResponseMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptConnectionResponse]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptConnectionResponseParameters
      const { connectionId } = parameters
      await options.agent.didcomm.connections.acceptResponse(connectionId)
      return { outgoingMessageType: DidCommDidExchangeCompleteMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.QueryServiceFeatures]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as QueryServiceFeaturesParameters
      const { connectionId } = parameters
      const discoverFeaturesApi = options.agent.context.dependencyManager.resolve(DidCommDiscoverFeaturesApi)
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
      return { outgoingMessageType: DidCommFeaturesQueriesMessage.type.messageTypeUri }
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
      await options.agent.didcomm.oob.deleteById(parameters.outOfBandId)
      return { outgoingMessageType: DidCommKeylistUpdateMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptCredentialOffer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptCredentialOfferParameters
      const { credentialRecordId } = parameters
      await options.agent.didcomm.credentials.acceptOffer({
        credentialExchangeRecordId: credentialRecordId,
        autoAcceptCredential: DidCommAutoAcceptCredential.ContentApproved,
      })
      return { outgoingMessageType: DidCommRequestCredentialV2Message.type.messageTypeUri }
    }
  },
  [AgentActionType.DeclineCredentialOffer]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineCredentialOfferParameters
      await options.agent.didcomm.credentials.declineOffer({
        credentialExchangeRecordId: parameters.credentialRecordId,
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      return { outgoingMessageType: DidCommCredentialV2ProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.DeclineProofRequest]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineProofRequestParameters
      const { proofRecordId } = parameters
      await options.agent.didcomm.proofs.declineRequest({
        proofExchangeRecordId: proofRecordId,
        sendProblemReport: true,
      })
      return { outgoingMessageType: DidCommPresentationV2ProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.SendUserProfile]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendUserProfileParameters
      const { connectionId } = parameters
      await options.agent.modules.profile.sendUserProfile({ connectionId })
      return { outgoingMessageType: DidCommProfileMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.RequestUserProfile]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as RequestUserProfileParameters
      const { connectionId } = parameters
      await options.agent.modules.profile.requestUserProfile({ connectionId })
      return { outgoingMessageType: DidCommRequestProfileMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptProofRequest]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofRequestParameters
      const { proofRecordId } = parameters
      const requestedCredentials = await options.agent.didcomm.proofs.selectCredentialsForRequest({
        proofExchangeRecordId: proofRecordId,
      })
      await options.agent.didcomm.proofs.acceptRequest({
        proofExchangeRecordId: proofRecordId,
        proofFormats: { anoncreds: requestedCredentials?.proofFormats.anoncreds },
      })
      return { outgoingMessageType: DidCommPresentationV2Message.type.messageTypeUri }
    }
  },
  [AgentActionType.AcceptProofProposal]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofProposalParameters
      const { proofRecordId } = parameters
      await options.agent.didcomm.proofs.acceptProposal({
        proofExchangeRecordId: proofRecordId,
        autoAcceptProof: DidCommAutoAcceptProof.ContentApproved,
      })
      return { outgoingMessageType: DidCommRequestPresentationV2Message.type.messageTypeUri }
    }
  },
  [AgentActionType.ProofSendProblemReport]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ProofSendProblemReportParameters
      const { proofRecordId, description } = parameters
      const proofRecord = await options.agent.didcomm.proofs.getById(proofRecordId)
      await options.agent.didcomm.proofs.sendProblemReport({
        proofExchangeRecordId: proofRecordId,
        description,
      })
      proofRecord.state = DidCommProofState.Abandoned
      await options.agent.didcomm.proofs.update(proofRecord)
      options.agent.events.emit<DidCommProofStateChangedEvent>(options.agent.context, {
        type: DidCommProofEventTypes.ProofStateChanged,
        payload: {
          proofRecord: proofRecord.clone(),
          previousState: null,
        },
      })
      return { outgoingMessageType: DidCommPresentationV2ProblemReportMessage.type.messageTypeUri }
    }
  },
  [AgentActionType.SavePushNotificationDeviceInfo]: action => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SavePushNotificationDeviceInfoParameters
      const { connectionId, deviceToken } = parameters
      await options.agent.modules.pushNotifications.setDeviceInfo({
        connectionId,
        deviceInfo: {
          deviceToken,
          devicePlatform: Platform.OS,
        },
      })
      return { outgoingMessageType: DidCommPushNotificationsFcmSetDeviceInfoMessage.type.messageTypeUri }
    }
  },
}
