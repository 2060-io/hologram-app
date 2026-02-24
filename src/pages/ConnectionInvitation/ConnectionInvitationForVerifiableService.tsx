import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'

import BaseConnectionInvitation, { ConnectionInvitationProps } from './BaseConnectionInvitation'
import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@src/components/common'
import { useUserProfile } from '@src/hooks/agent'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceStatus } from '@src/model'

const ConnectionInvitationForVerifiableService = (props: ConnectionInvitationProps) => {
  const { route } = props
  const { outOfBandRecord } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const did = invitation.invitationDids[0]
  const { userProfileData } = useUserProfile()
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo(did)
  const [minimumAgeRequired, setMinimumAgeRequired] = useState(0)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(TrustResolutionOutcome.INVALID)
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })
  const userName = userProfileData?.displayName

  useEffect(() => {
    if (serviceInfo) {
      setMinimumAgeRequired(serviceInfo.minimumAgeRequired)
      setServiceStatus(serviceInfo.status)
    }
  }, [serviceInfo])

  const refreshServiceInfo = useCallback(() => {
    getServiceInfo()
  }, [])

  return (
    <BaseConnectionInvitation
      {...props}
      refreshControl={<RefreshControl refreshing={isFetchingInfo} onRefresh={refreshServiceInfo} />}
      mainInfo={
        <View>
          {ageRestricted && <CanNotConnect kidAge={kidAge} userName={userName} />}
          <ServiceInformation
            isFetchingInfo={isFetchingInfo}
            serviceInfo={serviceInfo}
            failedFetchInfo={failedFetchInfo}
            withLoadingSkeleton={false}
          />
        </View>
      }
      ageRestricted={ageRestricted}
    />
  )
}

export default ConnectionInvitationForVerifiableService
