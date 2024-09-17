import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native'

import { TextInputForwardRefProps } from './TextInputProps'
import styles from './styles'

interface InputProps extends TextInputProps {
  textInputstyle?: StyleProp<TextStyle>
}

const CustomTextInput = forwardRef<TextInputForwardRefProps, InputProps>((textInputProps, ref) => {
  const textInputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => {
    return {
      onFocus() {
        textInputRef.current?.focus()
      },
      onBlur() {
        textInputRef.current?.blur()
      },
      onClearTextInput() {
        textInputRef.current?.clear()
      },
      onIsFocused() {
        return Boolean(textInputRef.current?.isFocused())
      },
    }
  })

  return (
    <TextInput
      ref={textInputRef}
      style={[styles.input, textInputProps.textInputstyle]}
      keyboardType="default"
      autoCorrect={false}
      {...textInputProps}
    />
  )
})

export default CustomTextInput
