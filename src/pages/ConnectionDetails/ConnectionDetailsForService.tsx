import React from 'react'
import { StyleSheet } from 'react-native'

import BaseConnectionDetails, { ConnectionDetailsProps } from './BaseConnectionDetails'

import { ProofOfTrust, ServiceMainInfo } from '@2060/components/common'
import { useFetchServiceInfo } from '@2060/hooks'

const ConnectionDetailsForService = (props: ConnectionDetailsProps) => {
  const { connection } = props
  const { serviceInfo } = useFetchServiceInfo(connection.invitationDid, true)

  return (
    <BaseConnectionDetails
      {...props}
      mainInfo={
        serviceInfo ? (
          <ServiceMainInfo serviceInfo={serviceInfo} containerStyle={styles.mainInfoContainer} />
        ) : null
      }
      footerInfo={serviceInfo ? <ProofOfTrust serviceInfo={serviceInfo} /> : null}
    />
  )
}

const styles = StyleSheet.create({
  mainInfoContainer: {
    marginVertical: 20,
  },
})

export default ConnectionDetailsForService
