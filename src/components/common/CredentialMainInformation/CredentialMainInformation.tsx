import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import React, { memo } from 'react'
import DumbCredentialMainInformation from './DumbCredentialMainInformation'
import { CredentialMainInformationProps } from './Pros'

const CredentialMainInformation = (props: CredentialMainInformationProps) => {
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo({
    did: props.credentialMainInfo?.issuer.id,
  })

  return (
    <DumbCredentialMainInformation
      {...props}
      isFetchingInfo={isFetchingInfo}
      serviceInfo={serviceInfo}
      failedFetchInfo={failedFetchInfo}
    />
  )
}

export default memo(CredentialMainInformation)
