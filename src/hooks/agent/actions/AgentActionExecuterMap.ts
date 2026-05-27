import { CallEndMessage, CallOfferMessage } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommMessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { DidCommProfileMessage, DidCommRequestProfileMessage } from '@2060.io/credo-ts-didcomm-user-profile'
import { PerformMessage } from '@credo-ts/action-menu'
import { BaseRecord } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommBasicMessage,
  DidCommBasicMessageV2,
  DidCommConnectionService,
  DidCommCredentialV2ProblemReportMessage,
  DidCommDidExchangeCompleteMessage,
  DidCommDidExchangeResponseMessage,
  DidCommDiscoverFeaturesApi,
  DidCommFeaturesQueriesMessage,
  DidCommKeylistUpdateMessage,
  DidCommKeylistUpdateV2Message,
  DidCommMessageSender,
  DidCommOutboundMessageContext,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandInvitationV2,
  DidCommOutOfBandRole,
  DidCommPresentationV2Message,
  DidCommPresentationV2ProblemReportMessage,
  DidCommProofEventTypes,
  DidCommProofState,
  DidCommProofStateChangedEvent,
  DidCommProposePresentationV2Message,
  DidCommRequestCredentialV2Message,
  DidCommRequestPresentationV2Message,
  DidCommTrustPingMessage,
} from '@credo-ts/didcomm'
import { DidCommPushNotificationsFcmSetDeviceInfoMessage } from '@credo-ts/didcomm-push-notifications'
import { AnswerMessage } from '@credo-ts/question-answer'
import { createOobInvitation, MobileAgent } from '@src/services/agent'
import { acceptProofRequestOrReportNoCompatible } from '@src/services/agent/proofPresentation'
import { log, logWarn } from '@src/utils'
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
  SendTrustPingParameters,
  SendUserProfileParameters,
  ShareMediaParameters,
} from './types'

type AgentCallbackReturnType<T extends BaseRecord = BaseRecord> = {
  associatedRecord?: T
  outgoingMessageTypes?: string[]
}
type ActionCallback = (options: { agent: MobileAgent }) => Promise<AgentCallbackReturnType<BaseRecord>>
type ActionFactory = (action: AgentAction) => ActionCallback

export const AgentActionExecuterMap: Record<AgentActionType, ActionFactory> = {
  [AgentActionType.SendTextMessage]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendTextMessageParameters
      const { connectionId, message, parentThreadId } = parameters
      const record = await options.agent.didcomm.basicMessages.sendMessage(connectionId, message, parentThreadId)
      const outgoingMessageTypes = [DidCommBasicMessage.type.messageTypeUri, DidCommBasicMessageV2.type.messageTypeUri]

      return {
        associatedRecord: record,
        outgoingMessageTypes,
      }
    }
  },
  [AgentActionType.SendReaction]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendReactionParameters
      await options.agent.modules.reactions.send(parameters)
      return { outgoingMessageTypes: [MessageReactionsMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.SendReceipts]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendReceiptsParameters
      const { connectionId, receipts } = parameters
      await options.agent.modules.receipts.send({
        connectionId,
        receipts: receipts.map((item) => ({
          messageId: item.messageId,
          state: item.state,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        })),
      })
      return { outgoingMessageTypes: [DidCommMessageReceiptsMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.ShareMedia]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ShareMediaParameters
      const { recordId } = parameters
      await options.agent.modules.media.share({ recordId })
      return { outgoingMessageTypes: [DidCommShareMediaMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.MenuSelection]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as MenuSelectionParameters
      const { connectionId, selectedItemName } = parameters
      await options.agent.modules.actionMenu.performAction({
        connectionId,
        performedAction: { name: selectedItemName },
      })
      return { outgoingMessageTypes: [PerformMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.ForwardConnection]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as ForwardConnectionParameters
      const { forwarderConnectionId, connectionId } = parameters
      const originDidcommConnection = await options.agent?.didcomm.connections.getById(forwarderConnectionId)
      const connection = await options.agent?.didcomm.connections.getById(connectionId)
      const sourceVersion = originDidcommConnection.didcommVersion ?? 'v1'
      const destVersion = connection.didcommVersion ?? 'v1'
      log(
        `Forward: source=${originDidcommConnection.id} (${sourceVersion}, ` +
          `${originDidcommConnection.invitationDid}) ` +
          `dest=${connection.id} (${destVersion}, ${connection.invitationDid})`
      )
      if (sourceVersion !== destVersion) {
        log(`Forward: version mismatch, throwing`)
        throw new Error(
          `Cannot forward across DIDComm versions: source is ${sourceVersion}, destination is ${destVersion}`
        )
      }
      const outOfBandInvitation = createOobInvitation(originDidcommConnection)
      const isV2 = outOfBandInvitation instanceof DidCommOutOfBandInvitationV2
      log(
        `Forward: built ${isV2 ? 'V2' : 'V1'} OOB invitation id=${outOfBandInvitation.id}, sending through ${destVersion} connection`
      )
      const messageSender = options.agent?.context.dependencyManager.resolve(DidCommMessageSender)
      await messageSender.sendMessage(
        new DidCommOutboundMessageContext(outOfBandInvitation, {
          agentContext: options.agent?.context,
          connection,
        })
      )
      log(`Forward: messageSender.sendMessage completed`)
      const outgoingType = isV2
        ? DidCommOutOfBandInvitationV2.type.messageTypeUri
        : DidCommOutOfBandInvitation.type.messageTypeUri
      return { outgoingMessageTypes: [outgoingType] }
    }
  },
  [AgentActionType.PresentCredential]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as PresentCredentialParameters
      const { connectionId, anoncredsAttributes } = parameters
      const proofExchangeRecord = await options.agent.didcomm.proofs.proposeProof({
        proofFormats: { anoncreds: { attributes: anoncredsAttributes } },
        connectionId,
        protocolVersion: 'v2',
      })
      return {
        outgoingMessageTypes: [DidCommProposePresentationV2Message.type.messageTypeUri],
        associatedRecord: proofExchangeRecord,
      }
    }
  },
  [AgentActionType.SendAnswer]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendAnswerParameters
      const { response, questionRecordId } = parameters
      const associatedRecord = await options.agent.modules.questionAnswer.sendAnswer(questionRecordId, response)
      return {
        outgoingMessageTypes: [AnswerMessage.type.messageTypeUri],
        associatedRecord,
      }
    }
  },
  [AgentActionType.AcceptConnectionRequest]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptConnectionRequestParameters
      const { connectionId } = parameters
      await options.agent.didcomm.connections.acceptRequest(connectionId)
      return { outgoingMessageTypes: [DidCommDidExchangeResponseMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.AcceptConnectionResponse]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptConnectionResponseParameters
      const { connectionId } = parameters
      await options.agent.didcomm.connections.acceptResponse(connectionId)
      return { outgoingMessageTypes: [DidCommDidExchangeCompleteMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.QueryServiceFeatures]: (action) => {
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
      return { outgoingMessageTypes: [DidCommFeaturesQueriesMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.SendTrustPing]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendTrustPingParameters
      const { connectionId } = parameters
      await options.agent.didcomm.connections.sendPing(connectionId, {})
      return { outgoingMessageTypes: [DidCommTrustPingMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.CreateCallOffer]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as CreateCallOfferParameters
      const { callType, connectionId, callInfo } = parameters
      await options.agent.modules.calls.offer({
        connectionId,
        callType,
        parameters: { ...callInfo },
      })
      return { outgoingMessageTypes: [CallOfferMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.HangupCall]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as HangupCallParameters
      await options.agent.modules.calls.hangup(parameters)
      return { outgoingMessageTypes: [CallEndMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.RemoveOutOfBandRecord]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as RemoveOutOfBandRecordParameters
      await options.agent.didcomm.oob.deleteById(parameters.outOfBandId)
      return {
        outgoingMessageTypes: [
          DidCommKeylistUpdateMessage.type.messageTypeUri,
          DidCommKeylistUpdateV2Message.type.messageTypeUri,
        ],
      }
    }
  },
  [AgentActionType.AcceptCredentialOffer]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptCredentialOfferParameters
      const { credentialRecordId } = parameters
      await options.agent.didcomm.credentials.acceptOffer({
        credentialExchangeRecordId: credentialRecordId,
        autoAcceptCredential: DidCommAutoAcceptCredential.ContentApproved,
      })
      return { outgoingMessageTypes: [DidCommRequestCredentialV2Message.type.messageTypeUri] }
    }
  },
  [AgentActionType.DeclineCredentialOffer]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineCredentialOfferParameters
      await options.agent.didcomm.credentials.declineOffer({
        credentialExchangeRecordId: parameters.credentialRecordId,
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      return { outgoingMessageTypes: [DidCommCredentialV2ProblemReportMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.DeclineProofRequest]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeclineProofRequestParameters
      const { proofRecordId } = parameters
      await options.agent.didcomm.proofs.declineRequest({
        proofExchangeRecordId: proofRecordId,
        sendProblemReport: true,
      })
      return { outgoingMessageTypes: [DidCommPresentationV2ProblemReportMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.SendUserProfile]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as SendUserProfileParameters
      await options.agent.modules.profile.sendUserProfile(parameters)
      return { outgoingMessageTypes: [DidCommProfileMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.RequestUserProfile]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as RequestUserProfileParameters
      const { connectionId } = parameters
      await options.agent.modules.profile.requestUserProfile({ connectionId })
      return { outgoingMessageTypes: [DidCommRequestProfileMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.AcceptProofRequest]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofRequestParameters
      const { proofRecordId } = parameters
      const result = await acceptProofRequestOrReportNoCompatible({
        agent: options.agent,
        proofRecordId,
      })

      if (result === 'problem-report') {
        return { outgoingMessageTypes: [DidCommPresentationV2ProblemReportMessage.type.messageTypeUri] }
      }

      return { outgoingMessageTypes: [DidCommPresentationV2Message.type.messageTypeUri] }
    }
  },
  [AgentActionType.AcceptProofProposal]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as AcceptProofProposalParameters
      const { proofRecordId } = parameters
      await options.agent.didcomm.proofs.acceptProposal({
        proofExchangeRecordId: proofRecordId,
        autoAcceptProof: DidCommAutoAcceptProof.ContentApproved,
      })
      return { outgoingMessageTypes: [DidCommRequestPresentationV2Message.type.messageTypeUri] }
    }
  },
  [AgentActionType.ProofSendProblemReport]: (action) => {
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
      return { outgoingMessageTypes: [DidCommPresentationV2ProblemReportMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.SavePushNotificationDeviceInfo]: (action) => {
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
      const didCommConnectionService = options.agent.dependencyManager.resolve(DidCommConnectionService)
      const connection = await didCommConnectionService.getById(options.agent.context, connectionId)
      connection.setTag('deviceToken', deviceToken)
      await didCommConnectionService.update(options.agent.context, connection)
      return { outgoingMessageTypes: [DidCommPushNotificationsFcmSetDeviceInfoMessage.type.messageTypeUri] }
    }
  },
  [AgentActionType.DeleteConnection]: (action) => {
    return async (options: { agent: MobileAgent }) => {
      const parameters = action.parameters as DeleteConnectionParameters
      const { connectionId, outOfBandRecordId } = parameters

      try {
        await options.agent.didcomm.connections.hangup({ connectionId, deleteAfterHangup: false })
      } catch (error) {
        logWarn(
          `Error hanging up connection: ${error}. It will be deleted directly. No HangUp retry will be
           performed.`
        )
      }

      let errorWhileDeleting: Error | undefined
      try {
        await options.agent.didcomm.connections.deleteById(connectionId)
      } catch (error) {
        logWarn(
          `Error deleting connection ${connectionId} directly. Forcing deletion before throwing 
          for KeylistUpdate retry process`
        )
        const didCommConnectionService = options.agent.dependencyManager.resolve(DidCommConnectionService)
        const connection = await didCommConnectionService.findById(options.agent.context, connectionId)
        if (connection) {
          await didCommConnectionService.deleteById(options.agent.context, connectionId)
        }
        errorWhileDeleting = error as Error
      }

      // Once the connection has been eliminated, delete its associated OOB record (only if we were invited
      // as the OOB record can be still valid for invitations we have created)
      if (outOfBandRecordId) {
        const outOfBandRecord = await options.agent.didcomm.oob.findById(outOfBandRecordId)
        if (outOfBandRecord?.role === DidCommOutOfBandRole.Receiver) {
          await options.agent.didcomm.oob.deleteById(outOfBandRecordId)
        }
      }

      if (errorWhileDeleting) {
        throw errorWhileDeleting
      }

      return {
        outgoingMessageTypes: [
          DidCommKeylistUpdateMessage.type.messageTypeUri,
          DidCommKeylistUpdateV2Message.type.messageTypeUri,
        ],
      }
    }
  },
}
