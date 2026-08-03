import { ServiceInformation } from '@src/components/common'
import { useUserProfile } from '@src/hooks/agent'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo, ServiceStatus, UNVERIFIED_SERVICE_STATUS } from '@src/model'
import { isVeranaActionBlocked, isVeranaResolutionPending, veranaTrustStatusOf } from '@src/services/verana'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import BaseConnectionInvitation, { ConnectionInvitationProps } from './BaseConnectionInvitation'
import CanNotConnect from './CanNotConnect'

const ConnectionInvitationForVerifiableService = (props: ConnectionInvitationProps) => {
  const { route } = props
  const { outOfBandRecord } = route.params
  const invitation = outOfBandRecord?.outOfBandInvitation
  const did = invitation.invitationDids[0]
  const { userProfileData } = useUserProfile()
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo({ did })
  const initialServiceInfo = useRef<ServiceInfo>({
    did,
    description: invitation.label,
    id: invitation.id,
    logoUrl: invitation.imageUrl,
    name: invitation.label ?? '',
    minimumAgeRequired: 0,
    status: UNVERIFIED_SERVICE_STATUS,
    trustStatus: 'UNVERIFIED',
    claimsVerified: false,
  }).current
  const [minimumAgeRequired, setMinimumAgeRequired] = useState(initialServiceInfo.minimumAgeRequired)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(initialServiceInfo.status)
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })
  const userName = userProfileData?.displayName
  const trustBlocked = isVeranaActionBlocked({
    trustStatus: veranaTrustStatusOf(serviceInfo, failedFetchInfo),
    isResolving: isVeranaResolutionPending({ did, serviceInfo, isFetchingInfo, failedFetchInfo }),
  })

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
      onSwipeDown={refreshServiceInfo}
      disabledSwipeDown={isFetchingInfo}
      mainInfo={
        <View>
          {ageRestricted && <CanNotConnect kidAge={kidAge} userName={userName} />}
          <ServiceInformation
            initialServiceInfo={initialServiceInfo}
            isFetchingInfo={isFetchingInfo}
            serviceInfo={serviceInfo}
            failedFetchInfo={failedFetchInfo}
          />
        </View>
      }
      ageRestricted={ageRestricted}
      trustBlocked={trustBlocked}
    />
  )
}

export default ConnectionInvitationForVerifiableService
