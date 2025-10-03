import React, { ElementType, useState, useEffect, useRef } from 'react'
import Config from 'react-native-config'

import { Invitation, UserInvitationProps, WrapperUserInvitationProps } from './UserInvitationProps'

import { ModalLoading } from '@2060/components/common'
import { AgentActionType, useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { createInvitation, getOutOfBandRecordById } from '@2060/services/agent/oob'
import {
  getStorageData,
  setStorageData,
  USER_INVITATION_OUT_OF_BAND_RECORD_ID,
} from '@2060/services/localStorage'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const withUserInvitation = (UserInvitationComponent: ElementType<UserInvitationProps>) => {
  const WrapperUserInvitation = (props: WrapperUserInvitationProps) => {
    const { addAgentActionToQueue } = useAgentActionQueue()
    const { userProfileData } = useUserProfile()
    const { agent } = useMobileAgent()
    const [creatingInvitation, setCreatingInvitation] = useState(false)
    const [invitation, setInvitation] = useState<Invitation>()
    const currentInvitationOutOfBandRecordId = useRef<string>(null)

    useEffect(() => {
      const setupInvitation = async () => {
        const persistedOutOfBandRecordId = (await getStorageData(
          USER_INVITATION_OUT_OF_BAND_RECORD_ID,
        )) as string
        if (persistedOutOfBandRecordId) {
          getCurrentInvitation(persistedOutOfBandRecordId)
        } else {
          createNewInvitation()
        }
      }
      setupInvitation()
    }, [])

    const getCurrentInvitation = async (outOfBandRecordId: string) => {
      if (!agent) return
      try {
        currentInvitationOutOfBandRecordId.current = outOfBandRecordId
        const { outOfBandInvitation } = await getOutOfBandRecordById(agent, outOfBandRecordId)
        setInvitation({
          displayName: outOfBandInvitation.label ?? 'Unlabeled',
          code: outOfBandInvitation.toUrl({ domain: Config.BASE_INVITATION_URL as string }),
        })
      } catch (error) {
        props.navigation.goBack()
        toast({ type: 'error', message: 'Error getting current invitation' })
        logError(`Error getting current invitation ${error}`)
      }
    }

    const createNewInvitation = async () => {
      if (!agent) return
      try {
        setCreatingInvitation(true)
        const newOutOfBandRecord = await createInvitation(agent, {
          label: userProfileData?.displayName,
        })
        setInvitation({
          displayName: newOutOfBandRecord.outOfBandInvitation.label ?? 'Unlabeled',
          code: newOutOfBandRecord.outOfBandInvitation.toUrl({
            domain: Config.BASE_INVITATION_URL as string,
          }),
        })
        if (currentInvitationOutOfBandRecordId.current) {
          addAgentActionToQueue({
            type: AgentActionType.RemoveOutOfBandRecord,
            parameters: { outOfBandId: currentInvitationOutOfBandRecordId.current },
          })
        }
        await setStorageData(USER_INVITATION_OUT_OF_BAND_RECORD_ID, newOutOfBandRecord.id)
        currentInvitationOutOfBandRecordId.current = newOutOfBandRecord.id
      } catch (error) {
        props.navigation.goBack()
        toast({ type: 'error', message: 'Error creating invitation' })
        logError(`Error creating invitation ${error}`)
      } finally {
        setCreatingInvitation(false)
      }
    }

    if (creatingInvitation || !invitation) {
      return <ModalLoading visible={creatingInvitation || !invitation} />
    }

    return (
      <UserInvitationComponent
        {...props}
        userProfileData={userProfileData}
        invitation={invitation}
        createNewInvitation={createNewInvitation}
      />
    )
  }
  return WrapperUserInvitation
}

export default withUserInvitation
