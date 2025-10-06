import { OutOfBandInvitation, Buffer } from '@credo-ts/core'
import React, { ElementType, useEffect, useMemo, useTransition } from 'react'
import Config from 'react-native-config'

import { HomeTabProps } from './HomeMainProps'

import { Loader } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { DidcommInvitationType, processInvitation as agentProcessInvitation } from '@2060/services/agent'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const HomeMainContainer = (HomeMainComponent: ElementType) => {
  const WrapperHomeMain = (props: HomeTabProps) => {
    const [isProcessingLink, startProcessDeepLink] = useTransition()
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
      startProcessDeepLink(async () => {
        try {
          const [[parameterType, value]] = Object.entries(route.params!)

          let invitationUrl: string | undefined
          if (parameterType === 'oobUrl') invitationUrl = value
          else if (parameterType === '_url') {
            invitationUrl = value ? Buffer.from(value, 'base64').toString('ascii') : undefined
          } else invitationUrl = `${Config.BASE_INVITATION_URL}?${parameterType}=${value}`

          if (!invitationUrl) throw new Error('Invalid invitation URL')

          const invitation = await agent?.oob.parseInvitation(invitationUrl)
          if (invitation) processInvitation(invitation)
        } catch (error) {
          toast({ type: 'error', message: `${error}` })
          logError('Error processing deep link', error)
        }
      })
    }

    const processInvitation = async (invitation: OutOfBandInvitation) => {
      if (!agent) return
      try {
        const { success, existingConnectionId, invitationType, recordId, error } =
          await agentProcessInvitation(agent, invitation)
        if (!success || !recordId) throw new Error(error)

        if (invitationType === DidcommInvitationType.ConnectionRequest) {
          const outOfBandRecord = await agent.oob.getById(recordId)
          navigation.navigate('ConnectionInvitation', {
            outOfBandRecord,
            existingConnectionId,
          })
        } else if (invitationType === DidcommInvitationType.CredentialOffer) {
          navigation.navigate('DidcommCredentialOffer', {
            credentialRecordId: recordId,
          })
        } else if (invitationType === DidcommInvitationType.PresentationRequest) {
          navigation.navigate('DidcommPresentationRequest', {
            proofRecordId: recordId,
            did: invitation.invitationDids[0],
          })
        }
      } catch (error) {
        toast({ type: 'error', message: `${error}` })
        logError('Error processing invitation', error)
      }
    }

    if (route.params && isProcessingLink) return <Loader />

    return <HomeMainComponent {...props} />
  }

  return WrapperHomeMain
}

export default HomeMainContainer
