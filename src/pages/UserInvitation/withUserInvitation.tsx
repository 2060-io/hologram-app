import React, { ElementType, useState, useEffect, useRef, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import Config from 'react-native-config'

import { Invitation, UserInvitationProps, WrapperUserInvitationProps } from './UserInvitationProps'

import { ModalLoading } from '@2060/components/common'
import { AgentActionType, useAgentActionQueue, useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { RemoveOutOfBandRecordParameters } from '@2060/hooks/agent/actions/types'
import { createInvitation, getOutOfBandRecordById } from '@2060/services/agent/oob'
import {
  getStorageData,
  setStorageData,
  USER_INVITATION_OUT_OF_BAND_RECORD_ID,
} from '@2060/services/localStorage'
import { logError, logWarn } from '@2060/utils'
import { toast } from '@2060/utils/toast'

const withUserInvitation = (UserInvitationComponent: ElementType<UserInvitationProps>) => {
  const WrapperUserInvitation = (props: WrapperUserInvitationProps) => {
    const { t } = useTranslation()
    const { addAgentActionToQueue } = useAgentActionQueue()
    const { userProfileData } = useUserProfile()
    const { agent } = useMobileAgent()
    const [creatingInvitation, startCreateInvitationTransition] = useTransition()
    const [invitation, setInvitation] = useState<Invitation>()
    const currentInvitationOutOfBandRecordId = useRef<string>(null)

    useEffect(() => {
      const setupInvitation = async () => {
        const currentInvitation = await getCurrentInvitation()
        if (!currentInvitation) createNewInvitation()
      }
      setupInvitation()
    }, [])

    const getCurrentInvitation = async () => {
      if (!agent) return
      try {
        const persistedOutOfBandRecordId = (await getStorageData(USER_INVITATION_OUT_OF_BAND_RECORD_ID)) as
          | string
          | null
        if (!persistedOutOfBandRecordId) return

        currentInvitationOutOfBandRecordId.current = persistedOutOfBandRecordId
        const { outOfBandInvitation } = await getOutOfBandRecordById(agent, persistedOutOfBandRecordId)
        setInvitation({
          displayName: outOfBandInvitation.label ?? 'Unlabeled',
          url: outOfBandInvitation.toUrl({ domain: Config.BASE_INVITATION_URL as string }),
        })
        return outOfBandInvitation
      } catch (error) {
        toast({ type: 'warning', message: t('invitation.errorGettingInvitation') })
        logWarn(`Couldn't get current invitation: ${error}`)
      }
    }

    const createNewInvitation = async () => {
      if (!agent) return
      startCreateInvitationTransition(async () => {
        try {
          const newOutOfBandRecord = await createInvitation(agent, {
            label: userProfileData?.displayName,
            multiUseInvitation: true,
          })
          setInvitation({
            displayName: newOutOfBandRecord.outOfBandInvitation.label ?? 'Unlabeled',
            url: newOutOfBandRecord.outOfBandInvitation.toUrl({
              domain: Config.BASE_INVITATION_URL as string,
            }),
          })
          if (currentInvitationOutOfBandRecordId.current) {
            const parameters: RemoveOutOfBandRecordParameters = {
              outOfBandId: currentInvitationOutOfBandRecordId.current,
            }
            addAgentActionToQueue({
              type: AgentActionType.RemoveOutOfBandRecord,
              parameters,
            })
          }
          await setStorageData(USER_INVITATION_OUT_OF_BAND_RECORD_ID, newOutOfBandRecord.id)
          currentInvitationOutOfBandRecordId.current = newOutOfBandRecord.id
        } catch (error) {
          if (!currentInvitationOutOfBandRecordId.current) props.navigation.goBack()
          toast({ type: 'error', message: t('invitation.errorCreatingInvitation') })
          logError(`Error creating invitation ${error}`)
        }
      })
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
