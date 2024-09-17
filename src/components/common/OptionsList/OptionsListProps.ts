import { ReactElement } from 'react'

export type OptionProps = {
  iconName?: string
  text: string
  onPress?: () => void
  rightContent?: () => ReactElement
}

export type Props = {
  options: Array<OptionProps>
}
