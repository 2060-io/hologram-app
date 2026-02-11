import { DidCommConnectionRecord } from '@credo-ts/didcomm'

import { ServiceInfo } from '@src/model'

export type Props = {
  connection: DidCommConnectionRecord
}

export type WithConnectionValidateProps = {
  connection?: DidCommConnectionRecord
}

export type PeerSecuritySystemMessageProps = {
  connection?: DidCommConnectionRecord
}

export type ServiceSecuritySystemMessageProps = {
  serviceInfo: ServiceInfo
}
