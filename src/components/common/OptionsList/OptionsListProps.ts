import { ReactElement } from 'react'

import { IconsNames } from '@2060/components/common/SvgIcon'

export type Option = {
  iconName?: keyof IconsNames
  text: string
  onPress?: () => void
  rightContent?: () => ReactElement
}

export type Props = {
  options: Option[]
}
