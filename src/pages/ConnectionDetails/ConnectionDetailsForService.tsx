import React from 'react'
import { StyleSheet } from 'react-native'

import BaseConnectionDetails, { ConnectionDetailsProps } from './BaseConnectionDetails'

import { ProofOfTrust, ServiceMainInfo } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks'

const ConnectionDetailsForService = (props: ConnectionDetailsProps) => {
  const { connection } = props
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo(connection.invitationDid)

  return (
    <BaseConnectionDetails
      {...props}
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
        <ProofOfTrust
          serviceInfo={serviceInfo}
          isFetchingInfo={isFetchingInfo}
          failedFetchInfo={failedFetchInfo}
        />
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
