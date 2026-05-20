import { IconsNames } from '@src/components/common/SvgIcon'
import { TouchableOpacityProps } from 'react-native'

export interface Props extends TouchableOpacityProps {
  iconName?: keyof IconsNames
  text: string
}
