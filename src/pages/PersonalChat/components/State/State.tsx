import React from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'

type Props = {
  text: string
  type?: 'success' | 'error' | 'warning'
}

const State = ({ text, type = 'success' }: Props) => {
  const theme = useTheme()
  const getMainColor: Record<'success' | 'error' | 'warning', string> = {
    success: theme.colors.green,
    error: theme.colors.red,
    warning: theme.colors.orange,
  }
  const mainColor = getMainColor[type]
  const styles = getStyles(theme, mainColor)
  return (
    <View style={styles.container}>
      <Text typography="EuclidCircularA-Bold" style={styles.text}>
        {text}
      </Text>
    </View>
  )
}

const getStyles = (theme: AppTheme, mainColor: string) =>
  StyleSheet.create({
    container: {
      borderRadius: 10,
      padding: 4,
      alignItems: 'center',
      backgroundColor: hexTransparency(mainColor, theme.isDarkMode ? '2E' : '40'),
    },
    text: {
      color: mainColor,
      fontSize: theme.fontSize.md - 1,
    },
  })

export default State
