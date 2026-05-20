import { ProofOfTrust, ServiceMainInfo } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks'
import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import BaseConnectionDetails, { ConnectionDetailsProps } from './BaseConnectionDetails'

const ConnectionDetailsForService = (props: ConnectionDetailsProps) => {
  const { connection } = props
  const { invitationDid } = connection
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo({
    did: invitationDid,
  })

  const refreshServiceInfo = useCallback(() => {
    getServiceInfo()
  }, [])

  return (
    <BaseConnectionDetails
      {...props}
      onSwipeDown={refreshServiceInfo}
      disabledSwipeDown={isFetchingInfo}
      mainInfo={
        serviceInfo ? (
          <ServiceMainInfo
            isFetchingInfo={isFetchingInfo}
            serviceInfo={serviceInfo}
            failedFetchInfo={failedFetchInfo}
            containerStyle={styles.mainInfoContainer}
          />
        ) : null
      }
      footerInfo={
        <ProofOfTrust serviceInfo={serviceInfo} isFetchingInfo={isFetchingInfo} failedFetchInfo={failedFetchInfo} />
      }
    />
  )
}

const styles = StyleSheet.create({
  mainInfoContainer: {
    marginVertical: 20,
  },
})

export default ConnectionDetailsForService
