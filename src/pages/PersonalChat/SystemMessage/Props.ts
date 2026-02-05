import { DidCommConnectionRecord } from '@credo-ts/didcomm'

import { SystemMessageKind } from '@2060/model'

export type SystemMessageProps = {
  connection?: DidCommConnectionRecord
  kind: SystemMessageKind
  text: string
}

export type BlockedConnectionMessageProps = SystemMessageProps & {
  connectionId?: string
}
