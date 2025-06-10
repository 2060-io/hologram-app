import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'

const CompressingVideo = ({ progress }: { progress: number }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.green} />
      <Text
        typography="EuclidCircularA-Regular"
        style={styles.text}
      >{`${t('personalChat.processingVideo')} ${progress}%`}</Text>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.53)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: theme.colors.white,
      fontSize: theme.fontSize.md,
    },
  })

export default CompressingVideo
