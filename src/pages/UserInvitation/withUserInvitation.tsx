import React, { ElementType, useState, useEffect, useRef } from 'react'
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
    const { userProfileData } = useUserProfile()
    const { agent } = useMobileAgent()
    const [creatingInvitation, setCreatingInvitation] = useState(false)
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>()
    const storedOutOfBandRecordIdRef = useRef<string>(null)

    useEffect(() => {
      const setupInvitation = async () => {
        const storedOutOfBandRecordId = (await getStorageData(
          USER_INVITATION_OUT_OF_BAND_RECORD_ID,
        )) as string
        if (storedOutOfBandRecordId) {
          storedOutOfBandRecordIdRef.current = storedOutOfBandRecordId
          getCurrentInvitation(storedOutOfBandRecordId)
        } else {
          createNewInvitation()
        }
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
        toast({ type: 'error', message: 'Error getting current invitation' })
        logError(`Error getting current invitation ${error}`)
      }
    }

    const createNewInvitation = async () => {
      if (!agent) return
      try {
        setCreatingInvitation(true)
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
        toast({ type: 'error', message: 'Error creating invitation' })
        logError(`Error creating invitation ${error}`)
      } finally {
        setCreatingInvitation(false)
      }
    }

    if (creatingInvitation || !connectionInfo) {
      return <ModalLoading visible={creatingInvitation || !connectionInfo} />
    }

    return (
      <UserInvitationComponent
        {...props}
        userProfileData={userProfileData}
        connectionInfo={connectionInfo}
        createNewInvitation={createNewInvitation}
      />
    )
  }
  return WrapperUserInvitation
}

export default withUserInvitation
