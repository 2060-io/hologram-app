import { TouchableOpacityProps } from 'react-native'

import { IconsNames } from '@2060/components/common/SvgIcon'

export interface Props extends TouchableOpacityProps {
  iconName?: keyof IconsNames
  text: string
}
