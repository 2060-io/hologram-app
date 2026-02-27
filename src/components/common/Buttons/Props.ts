import { TouchableOpacityProps } from 'react-native'

import { IconsNames } from '@src/components/common/SvgIcon'

export interface Props extends TouchableOpacityProps {
  iconName?: keyof IconsNames
  text: string
}
