import React from 'react'
import { View } from 'react-native'

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
        <View style={{ marginVertical: 20 }}>
          {serviceInfo && <ServiceMainInfo serviceInfo={serviceInfo} />}
        </View>
      }
      footerInfo={<View>{serviceInfo && <ProofOfTrust serviceInfo={serviceInfo} />}</View>}
      isService
    />
  )
}

export default ConnectionDetailsForService
