import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { AppTheme } from '@src/styles'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { Props } from './Props'

const BlueButton = ({ text, ...buttonProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const style = [styles.container, buttonProps?.style]
  return (
    <TouchableOpacity {...buttonProps} style={style}>
      <Text fontFamily="EuclidCircularA-Bold" style={styles.buttonText}>
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
