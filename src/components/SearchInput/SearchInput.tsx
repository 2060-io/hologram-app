import { t } from 'i18next'
import React, { useState, useEffect } from 'react'
import { View } from 'react-native'

import { SearchInputProps } from './SearchInputProps'
import getStyles from './styles'

import { TextInput } from '@src/components/common'
import { useDebouncedValue } from '@src/hooks'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

const SearchInput = ({
  placeholder,
  value = '',
  containerStyle,
  onDebounced,
  textInputProps,
  renderLeftIcon,
  renderRightIcon,
}: SearchInputProps) => {
  const [textValue, setTextValue] = useState(value)
  const debouncedValue = useDebouncedValue(textValue)
  const theme = useTheme()
  const styles = getStyles(theme)
  const defaultPlaceholder = placeholder ?? t('connection.searchConnection')

  useEffect(() => {
    onDebounced(debouncedValue)
  }, [debouncedValue])

  return (
    <View style={[styles.containerTextInput, containerStyle]}>
      {renderLeftIcon && renderLeftIcon()}
      <TextInput
        value={textValue}
        placeholderTextColor={theme.colors.secondaryText}
        placeholder={defaultPlaceholder}
        style={styles.textInput}
        autoCapitalize="none"
        onChangeText={setTextValue}
        {...textInputProps}
      />
      {renderRightIcon && renderRightIcon()}
    </View>
  )
}

export default SearchInput
