import { ProofOfTrustCard } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks'
import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
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
          <View style={styles.mainInfoContainer}>
            <ProofOfTrustCard
              serviceInfo={serviceInfo}
              isFetchingInfo={isFetchingInfo}
              failedFetchInfo={failedFetchInfo}
              onRetry={refreshServiceInfo}
            />
          </View>
        ) : null
      }
    />
  )
}

const styles = StyleSheet.create({
  mainInfoContainer: {
    marginBottom: 20,
  },
})

export default ConnectionDetailsForService
