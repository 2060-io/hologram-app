import { TypedArrayEncoder } from '@credo-ts/core'
import { DidCommOutOfBandInvitation } from '@credo-ts/didcomm'
import React, { ElementType, useEffect, useMemo, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import Config from 'react-native-config'

import { HomeTabProps } from './HomeMainProps'

import { Loader } from '@src/components/common'
import { useMobileAgent } from '@src/hooks/agent'
import {
  DidcommInvitationType,
  processInvitation as agentProcessInvitation,
  getOutOfBandRecordById,
} from '@src/services/agent'
import { log, logError } from '@src/utils'
import { toast } from '@src/utils/toast'

const HomeMainContainer = (HomeMainComponent: ElementType) => {
  const WrapperHomeMain = (props: HomeTabProps) => {
    const { t } = useTranslation()
    const [isProcessingLink, startProcessDeepLinkTransition] = useTransition()
    const { agent } = useMobileAgent()
    const { navigation, route } = props

    const areValidParams = useMemo(() => {
      if (!route.params) return false
      const parameters = Object.keys(route.params)
      return ['oob', 'd_m', 'c_i', '_url'].includes(parameters[0])
    }, [route.params])

    useEffect(() => {
      if (areValidParams) processDeepLink()
    }, [route.params])

    const processDeepLink = async () => {
      if (!agent) return
      startProcessDeepLinkTransition(async () => {
        try {
          const [[parameterType, urlValue]] = Object.entries(route.params!)
          let invitationUrl: string | undefined
          if (parameterType === 'oobUrl') invitationUrl = urlValue
          else if (parameterType === '_url') {
            invitationUrl = urlValue
              ? TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64(urlValue))
              : undefined
          } else invitationUrl = `${Config.BASE_INVITATION_URL}?${parameterType}=${urlValue}`
          if (!invitationUrl) throw new Error('Invalid invitation URL')
          const invitation = await agent.didcomm.oob.parseInvitation(invitationUrl)
          processInvitation(invitation)
        } catch (error) {
          toast({ type: 'error', message: `${error}` })
          logError('Error processing deep link', error)
        }
      })
    }

    const processInvitation = async (invitation: DidCommOutOfBandInvitation) => {
      if (!agent) return
      try {
        const processInvitationResult = await agentProcessInvitation(agent, invitation)
        log('processInvitationResult:', processInvitationResult)
        if (!processInvitationResult.success) throw new Error(processInvitationResult.error)
        const { recordId, existingConnectionId, invitationType } = processInvitationResult
        if (invitationType === DidcommInvitationType.ConnectionRequest) {
          const outOfBandRecord = await getOutOfBandRecordById(agent, recordId)
          navigation.navigate('ConnectionInvitation', {
            outOfBandRecord,
            existingConnectionId,
          })
        } else if (invitationType === DidcommInvitationType.CredentialOffer) {
          navigation.navigate('DidcommCredentialOffer', {
            credentialRecordId: recordId,
            did: invitation.invitationDids[0],
          })
        } else if (invitationType === DidcommInvitationType.PresentationRequest) {
          navigation.navigate('DidcommPresentationRequest', {
            proofRecordId: recordId,
            did: invitation.invitationDids[0],
          })
        } else {
          navigation.navigate('EphemeralCredentialPresentation', { proofRecordId: recordId })
        }
      } catch (error) {
        toast({ type: 'error', message: t('invitation.errorProcessingInvitation') })
        logError(`Error processing invitation: ${error}`)
      }
    }

    if (route.params && isProcessingLink) return <Loader />

    return <HomeMainComponent {...props} />
  }

  return WrapperHomeMain
}

export default HomeMainContainer
