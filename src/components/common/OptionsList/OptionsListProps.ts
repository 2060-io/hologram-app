import { IconsNames } from '@src/components/common/SvgIcon'
import { ReactElement } from 'react'

export type Option = {
  iconName?: keyof IconsNames
  text: string
  onPress?: () => void
  rightContent?: () => ReactElement
}

export type Props = {
  options: Option[]
}
