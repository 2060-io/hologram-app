import { DidCommActionMenu } from '@credo-ts/didcomm-action-menu'

export type ContextualMenuProps = {
  menu: DidCommActionMenu
  connectionIconUrl?: string
  onSelectOption(optionName: string): void
}
