import React, { useCallback } from 'react'
import { RefreshControl, StyleSheet } from 'react-native'

import BaseConnectionDetails, { ConnectionDetailsProps } from './BaseConnectionDetails'

import { ProofOfTrust, ServiceMainInfo } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks'

const ConnectionDetailsForService = (props: ConnectionDetailsProps) => {
  const { connection } = props
  const { invitationDid } = connection
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo(invitationDid)

  const refreshServiceInfo = useCallback(() => {
    getServiceInfo()
  }, [])

  return (
    <BaseConnectionDetails
      {...props}
      refreshControl={<RefreshControl refreshing={isFetchingInfo} onRefresh={refreshServiceInfo} />}
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
      footerInfo={<ProofOfTrust serviceInfo={serviceInfo} isFetchingInfo={isFetchingInfo} />}
    />
  )
}

const styles = StyleSheet.create({
  mainInfoContainer: {
    marginVertical: 20,
  },
})

export default ConnectionDetailsForService
