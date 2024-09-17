import React from 'react'
import { SvgProps } from 'react-native-svg'

import Icons from '@2060/assets/icons'
import Default from '@2060/assets/icons/Default'

export type IconsNames = typeof Icons

export interface IconProps extends SvgProps {
  name: keyof IconsNames
}

const SvgIcon = ({
  name,
  preserveAspectRatio = 'xMidYMid meet',
  width = 24,
  height = 24,
  ...restOfProps
}: IconProps) => {
  const Icon = (Icons[name] ?? Default) as React.FC<Partial<SvgProps>>
  return <Icon {...restOfProps} preserveAspectRatio={preserveAspectRatio} height={height} width={width} />
}

export default SvgIcon
