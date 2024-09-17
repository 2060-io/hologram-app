import { t } from 'i18next'
import React, { memo } from 'react'
import {
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native'

import getStyles from './styles'

import { Text, SvgIcon } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  uri: string
  isRetryingUpload: boolean
  containerStyle: StyleProp<ViewStyle>
  onRetryMediaUpload(): Promise<void>
}

const RetryMediaUploadView: React.FC<Props> = ({
  uri,
  isRetryingUpload,
  containerStyle,
  onRetryMediaUpload,
}) => {
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
            <Text typography="EuclidCircularA-Medium" style={styles.btnText}>
              {t('general.retry').toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  )
}

export default memo(RetryMediaUploadView)
