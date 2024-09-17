import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

import { Props } from './Props'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'

const BlueButton = ({ text, ...buttonProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const style = [styles.container, buttonProps?.style]
  return (
    <TouchableOpacity {...buttonProps} style={style}>
      <Text typography="EuclidCircularA-Bold" style={styles.buttonText}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.blue,
      borderRadius: 10,
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: theme.colors.secondary,
      fontSize: theme.fontSize.md - 1,
      textAlign: 'center',
    },
  })

export default BlueButton
