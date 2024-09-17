import { StyleProp, ViewStyle } from 'react-native'

export interface CustomSwitchProps {
  style?: StyleProp<ViewStyle>
  isDisabled?: boolean
  isChecked: boolean
  onToggle(): void
}
