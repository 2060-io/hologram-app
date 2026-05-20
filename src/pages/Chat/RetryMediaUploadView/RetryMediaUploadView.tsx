import { SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { t } from 'i18next'
import React, { memo } from 'react'
import { ActivityIndicator, ImageBackground, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native'
import getStyles from './styles'

type Props = {
  uri: string
  isRetryingUpload: boolean
  containerStyle: StyleProp<ViewStyle>
  onRetryMediaUpload(): Promise<void>
}

const RetryMediaUploadView: React.FC<Props> = ({ uri, isRetryingUpload, containerStyle, onRetryMediaUpload }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <ImageBackground source={{ uri }} style={[styles.container, containerStyle]}>
      <View style={styles.containerBtn}>
        {isRetryingUpload ? (
          <ActivityIndicator size="large" color={theme.colors.green} />
        ) : (
          <TouchableOpacity style={styles.btn} onPress={onRetryMediaUpload}>
            <SvgIcon name="upload" fill={theme.colors.primary} />
            <Text fontFamily="EuclidCircularA-Medium" style={styles.btnText}>
              {t('general.retry').toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  )
}

export default memo(RetryMediaUploadView)
