import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { MainButton, Progress, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'

type Props = {
  progress: number
  cancelCompression: () => void
}

const CompressingVideo = ({ progress, cancelCompression }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`${t('chatConversation.processingVideo')} ${progress}%`}</Text>
      <Progress progress={progress} progressColor={theme.colors.green} />
      <MainButton text={t('general.cancel')} onPress={cancelCompression} />
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
      paddingHorizontal: 12,
    },
    text: {
      color: theme.colors.white,
      fontSize: theme.fontSize.md,
      marginBottom: 6,
    },
  })

export default CompressingVideo
