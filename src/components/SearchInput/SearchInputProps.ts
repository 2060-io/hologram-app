import { ReactElement } from 'react'
import { StyleProp, TextInputProps, ViewStyle } from 'react-native'

export type SearchInputProps = {
  containerStyle?: StyleProp<ViewStyle>
  textInputProps?: TextInputProps
  value?: string
  placeholder?: string
  onDebounced: (value: string) => void
  renderLeftIcon?(): ReactElement
  renderRightIcon?(): ReactElement
}
