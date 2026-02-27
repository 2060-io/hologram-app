import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'

import { Props } from '../Props'

import Text from '@src/components/common//Text'
import SvgIcon, { IconsNames } from '@src/components/common/SvgIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { AppTheme } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'

const CallButton = ({ iconName, text, ...buttonProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity {...buttonProps} style={styles.button}>
        <SvgIcon
          name={iconName as keyof IconsNames}
          fill={theme.colors.tertiaryText}
          width={'50%'}
          height={'50%'}
        />
      </TouchableOpacity>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    buttonContainer: {
      alignItems: 'center',
    },
    button: {
      height: 50,
      width: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.secondary, '40'),
    },
    text: {
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md,
    },
  })

export default CallButton
