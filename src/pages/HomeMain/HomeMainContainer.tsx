import { OutOfBandInvitation } from '@credo-ts/core'
import React, { ElementType, useEffect, useMemo, useState } from 'react'
import Config from 'react-native-config'

import { HomeTabProps } from './HomeMainProps'

import { Loader } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { DidcommInvitationType, processInvitation as agentProcessInvitation } from '@2060/services/agent'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const HomeMainContainer = (HomeMainComponent: ElementType) => {
  const WrapperHomeMain = (props: HomeTabProps) => {
    const [isProcessingLink, setIsProcessingLink] = useState(false)
    const { agent } = useMobileAgent()

    const { navigation, route } = props
    const navigate = navigation.navigate

    const isValidParams = useMemo(() => {
      if (!route.params) return false
      const parameters = Object.keys(route.params)
      return ['oob', 'd_m', 'c_i', '_url'].includes(parameters[0])
    }, [route.params])

    const goToConnectionDetails = (connectionId: string) =>
      navigate('ConnectionDetails', { connectionId, comesFromScan: true })

    const processInvitation = async (invitation: OutOfBandInvitation) => {
      if (!agent) throw new Error('Agent not defined')
      try {
        const { success, existingConnectionId, invitationType, recordId } = await agentProcessInvitation(
          agent,
          invitation,
        )
        if (!success || !recordId) return

        if (invitationType === DidcommInvitationType.ConnectionRequest) {
          if (existingConnectionId) {
            goToConnectionDetails(existingConnectionId)
          } else {
            const outOfBandRecord = await agent.oob.getById(recordId)
            navigation.navigate('ConnectionInvitation', { outOfBandRecord })
          }
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
      } finally {
        setIsProcessingLink(false)
      }
    }

    const processDeepLink = async () => {
      try {
        if (!agent) throw new Error('Agent not created')
        setIsProcessingLink(true)
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
        setIsProcessingLink(false)
        toast({ type: 'error', message: `${error}` })
        logError('Error processing deep link', error)
      }
    }

    useEffect(() => {
      if (isValidParams) processDeepLink()
    }, [route.params])

    if (route.params && isProcessingLink) return <Loader />

    return <HomeMainComponent {...props} />
  }

  return WrapperHomeMain
}

export default HomeMainContainer
