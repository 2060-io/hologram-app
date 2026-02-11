import { DidCommConnectionRecord } from '@credo-ts/didcomm'

import { SystemMessageKind } from '@src/model'

export type SystemMessageProps = {
  connection?: DidCommConnectionRecord
  kind: SystemMessageKind
  text: string
}

export type BlockedConnectionMessageProps = SystemMessageProps & {
  connectionId?: string
}
