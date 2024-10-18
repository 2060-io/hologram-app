import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { TextInput, TextInputProps } from 'react-native'

import { TextInputForwardRefProps } from './TextInputProps'
import styles from './styles'

const CustomTextInput = forwardRef<TextInputForwardRefProps, TextInputProps>((textInputProps, ref) => {
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
      keyboardType="default"
      autoCorrect={false}
      {...textInputProps}
      style={[styles.input, textInputProps.style]}
    />
  )
})

export default CustomTextInput
