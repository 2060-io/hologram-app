import { ConnectionRecord } from '@credo-ts/core'

import { SystemMessageKind } from '@2060/model'

export type SystemMessageProps = {
  connection?: ConnectionRecord
  kind: SystemMessageKind
  text: string
}

export type BlockedConnectionMessageProps = SystemMessageProps & {
  connectionId?: string
}
