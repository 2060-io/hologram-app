import React, { useState } from 'react'
import { View, TouchableOpacity, TextInputProps } from 'react-native'

import getStyles from './styles'

import SvgIcon from '@2060/components/common/SvgIcon'
import TextInput from '@2060/components/common/TextInput'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

const TextInputPassword = (props: TextInputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        secureTextEntry={!showPassword}
        contextMenuHidden={true}
        {...props}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <SvgIcon name={showPassword ? 'eyeOff' : 'eye'} fill={theme.colors.secondaryGrey} />
      </TouchableOpacity>
    </View>
  )
}

export default TextInputPassword
