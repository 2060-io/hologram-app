import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, LayoutChangeEvent, TextInputProps } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import getStyles from './styles'

import { TextInput } from '@src/components/common'
import { TextInputForwardRefProps } from '@src/components/common/TextInput'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

interface Props {
  isRepliedMessage: boolean
  textInputProps?: TextInputProps
  valueTextInput: string
  textInputRef: React.Ref<TextInputForwardRefProps>

  onTextChanged(text: string): void
}

const ComposerInput: React.FC<Props> = ({
  valueTextInput,
  isRepliedMessage,
  textInputProps,
  textInputRef,
  onTextChanged,
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const placeholder = t('personalChat.message')
  const styles = getStyles(theme)
  const [paddingVertical, setPadding] = useState(0)

  const onLayout = (e: LayoutChangeEvent) => {
    const newPadding = e.nativeEvent.layout.height > MESSAGE_INPUT_INITIAL_HEIGHT ? 4 : 0
    newPadding !== paddingVertical && setPadding(newPadding)
  }

  return (
    <View style={[styles.container, isRepliedMessage && styles.composerStylesWhenResponding]}>
      <TextInput
        ref={textInputRef}
        accessible
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor="#807F85"
        multiline
        onLayout={onLayout}
        onChange={({ nativeEvent: { text } }) => onTextChanged(text)}
        style={[styles.textInput, { paddingTop: paddingVertical, paddingBottom: paddingVertical }]}
        autoFocus={false}
        value={valueTextInput}
        enablesReturnKeyAutomatically
        underlineColorAndroid="transparent"
        autoCorrect={true}
        autoCapitalize="sentences"
        {...textInputProps}
      />
    </View>
  )
}

export default memo(ComposerInput)
