import React, { useState } from 'react'

import BaseConnectionInvitation, { ConnectionInvitationProps } from './BaseConnectionInvitation'
import PublicService from './PublicService'

import { useUserProfile } from '@src/hooks/agent'

const ConnectionInvitationForVerifiableService = (props: ConnectionInvitationProps) => {
  const { route } = props
  const { outOfBandRecord } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const invitationDid = invitation.invitationDids[0]
  const { userProfileData } = useUserProfile()
  const [ageRestricted, setAgeRestricted] = useState(false)

  return (
    <BaseConnectionInvitation
      {...props}
      mainInfo={
        <PublicService
          did={invitationDid}
          invitation={invitation}
          setAgeRestricted={setAgeRestricted}
          userName={userProfileData?.displayName}
        />
      }
      ageRestricted={ageRestricted}
    />
  )
}

export default ConnectionInvitationForVerifiableService
