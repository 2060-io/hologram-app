import { ActionMenu } from '@credo-ts/action-menu'

export type ContextualMenuProps = {
  menu: ActionMenu
  connectionIconUrl?: string
  onSelectOption(optionName: string): void
}
