import React, { ElementType, useState, useEffect } from 'react'
import Config from 'react-native-config'

import { ConnectionInfo, UserInvitationProps, WrapperUserInvitationProps } from './UserInvitationProps'

import { ModalLoading } from '@2060/components/common'
import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
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
    const [creatingInvitation, setCreatingInvitation] = useState(false)
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>()
    const { userProfileData } = useUserProfile()
    const { agent } = useMobileAgent()

    useEffect(() => {
      const setupInvitation = async () => {
        const storedOutOfBandRecordId = (await getStorageData(
          USER_INVITATION_OUT_OF_BAND_RECORD_ID,
        )) as string
        storedOutOfBandRecordId ? getCurrentInvitation(storedOutOfBandRecordId) : createNewInvitation()
      }
      setupInvitation()
    }, [])

    const getCurrentInvitation = async (outOfBandRecordId: string) => {
      if (!agent) return
      try {
        const { outOfBandInvitation } = await getOutOfBandRecordById(agent, outOfBandRecordId)
        setConnectionInfo({
          displayName: outOfBandInvitation.label ?? 'Unlabeled',
          invitationCode: outOfBandInvitation.toUrl({ domain: Config.BASE_INVITATION_URL as string }),
        })
      } catch (error) {
        props.navigation.goBack()
        const message = `Error getting current invitation ${error}`
        toast({ type: 'error', message })
        logError(message)
      }
    }

    const createNewInvitation = async () => {
      if (!agent) return
      setCreatingInvitation(true)
      try {
        const outOfBandRecord = await createInvitation(agent, {
          label: userProfileData?.displayName,
        })
        setConnectionInfo({
          displayName: outOfBandRecord.outOfBandInvitation.label ?? 'Unlabeled',
          invitationCode: outOfBandRecord.outOfBandInvitation.toUrl({
            domain: Config.BASE_INVITATION_URL as string,
          }),
        })
        await setStorageData(USER_INVITATION_OUT_OF_BAND_RECORD_ID, outOfBandRecord.id)
      } catch (error) {
        props.navigation.goBack()
        const message = `Error creating invitation ${error}`
        toast({ type: 'error', message })
        logError(message)
      } finally {
        setCreatingInvitation(false)
      }
    }

    if (creatingInvitation || !connectionInfo) {
      return <ModalLoading visible={creatingInvitation || !connectionInfo} />
    }

    return (
      <UserInvitationComponent {...props} userProfileData={userProfileData} connectionInfo={connectionInfo} />
    )
  }
  return WrapperUserInvitation
}

export default withUserInvitation
