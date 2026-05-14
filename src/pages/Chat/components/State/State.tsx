import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { AppTheme } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import React from 'react'
import { StyleSheet, View } from 'react-native'

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
      <Text fontFamily="EuclidCircularA-Bold" style={styles.text}>
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
