import React, { ElementType, useState, useEffect } from 'react'
import Config from 'react-native-config'

import { ConnectionInfo, UserInvitationProps, WrapperUserInvitationProps } from './UserInvitationProps'

import { ModalLoading } from '@2060/components/common'
import { useMobileAgent, useUserProfile } from '@2060/hooks/agent'
import { createInvitation } from '@2060/services/agent/oob'
import { toast } from '@2060/utils/toast'

const withUserInvitation = (UserInvitationComponent: ElementType<UserInvitationProps>) => {
  const WrapperUserInvitation = (props: WrapperUserInvitationProps) => {
    const [creatingInvitation, setCreatingInvitation] = useState(false)
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>()

    const { userProfileData } = useUserProfile()
    const { agent } = useMobileAgent()

    const handleCreateConnection = async () => {
      if (!agent) return
      setCreatingInvitation(true)
      try {
        const invitation = await createInvitation(agent, {
          label: userProfileData?.displayName,
        })
        setConnectionInfo({
          // TODO: Handle properly the case where no label is set
          displayName: invitation.label ?? 'Unlabeled',
          invitationCode: invitation.toUrl({ domain: Config.BASE_INVITATION_URL as string }),
        })
      } catch (error) {
        props.navigation.goBack()
        toast({ type: 'error', message: `Error creating invitation ${error}` })
      } finally {
        setCreatingInvitation(false)
      }
    }

    useEffect(() => {
      handleCreateConnection()
    }, [])

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
