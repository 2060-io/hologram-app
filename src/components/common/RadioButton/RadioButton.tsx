import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { View, ViewStyle } from 'react-native'
import getStyles from './styles'

type Props = {
  style?: ViewStyle
  isChecked: boolean
  testID?: string
}

const RadioButton = ({ style, isChecked, testID }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View testID={testID} style={[styles.radioButtonOutside, style]}>
      {isChecked && <View style={styles.radioButtonInside} />}
    </View>
  )
}

export default RadioButton
