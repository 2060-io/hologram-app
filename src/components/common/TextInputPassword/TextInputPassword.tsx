import SvgIcon from '@src/components/common/SvgIcon'
import TextInput from '@src/components/common/TextInput'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React, { useState } from 'react'
import { TextInputProps, TouchableOpacity, View } from 'react-native'
import getStyles from './styles'

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
