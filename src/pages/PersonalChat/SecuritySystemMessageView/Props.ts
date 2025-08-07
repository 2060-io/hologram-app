import { ConnectionRecord } from '@credo-ts/core'

import { ServiceInfo } from '@2060/model'

export type Props = {
  connection: ConnectionRecord
}

export type WithConnectionValidateProps = {
  connection?: ConnectionRecord
}

export type PeerSecuritySystemMessageProps = {
  connection?: ConnectionRecord
}

export type ServiceSecuritySystemMessageProps = {
  serviceInfo: ServiceInfo
}
