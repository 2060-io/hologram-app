import React from 'react'
import { View, ViewStyle } from 'react-native'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  style?: ViewStyle
  isChecked: boolean
}

const RadioButton = ({ style, isChecked }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={[styles.radioButtonOutside, style]}>
      {isChecked && <View style={styles.radioButtonInside} />}
    </View>
  )
}

export default RadioButton
