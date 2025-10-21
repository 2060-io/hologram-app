import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, TouchableOpacity, View, ActivityIndicator } from 'react-native'

import { ImageProps } from '../PersonalChatProps'
import RetryMediaUploadView from '../RetryMediaUploadView'
import { ParsedText } from '../components'

import ImageView from './ImageView'
import getStyles from './styles'

import imagePlaceholder from '@2060/assets/images/placeholderImg.png'
import { Icon, Text, Progress } from '@2060/components/common'
import { useMedia } from '@2060/hooks'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ImageMetadata, MediaDownloadState, MediaUploadState } from '@2060/model'
import { getFileSize } from '@2060/utils'
import { getLocalFileUri } from '@2060/utils/RNFS'
import { screenWidth } from '@2060/utils/responsiveUtils'

const MINIMUM_ASPECT_RATIO = 2 / 3
const SCREEN_WIDTH_TO_75_PERCENTAGE = screenWidth * 0.75
const HALF_SCREEN_SIZE = screenWidth * 0.5

const getImageDimensions = (metadata: ImageMetadata) => {
  if (metadata.height && metadata.width) return { width: metadata.width, height: metadata.height }
  return { width: HALF_SCREEN_SIZE, height: HALF_SCREEN_SIZE }
}

const getFinalImageWidth = (imageWidth: number) => {
  if (imageWidth < HALF_SCREEN_SIZE) return HALF_SCREEN_SIZE
  if (imageWidth > SCREEN_WIDTH_TO_75_PERCENTAGE) return SCREEN_WIDTH_TO_75_PERCENTAGE
  return imageWidth
}

const getImageStyle = (metadata: ImageMetadata) => {
  const { width, height } = getImageDimensions(metadata)
  const imageAspectRatio = width / height
  const mustSetToMinimumAspectRatio = imageAspectRatio < MINIMUM_ASPECT_RATIO
  const aspectRatio = mustSetToMinimumAspectRatio ? MINIMUM_ASPECT_RATIO : imageAspectRatio
  const finalImageWidth = getFinalImageWidth(width)
  const imageStyle = { width: finalImageWidth, height: undefined, aspectRatio }
  return imageStyle
}

const ImageChatView = (props: ImageProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { mediaRecordId, fileMediaInfo, chatEntry, displayTimeAndTicks } = props
  const metadata = chatEntry.metadata as ImageMetadata
  const {
    mediaDownloadState,
    mediaDownloadProgress,
    localFilePath,
    localPreviewFilePath,
    preview,
    mediaUploadState,
    mediaUploadProgress,
    byteCount,
    description,
  } = metadata
  const { isDownloaded, isDownloading, downloadMedia, retryMediaUpload, isRetryingUpload } = useMedia({
    mediaRecordId,
    localFilePath,
    type: 'images',
    mediaDownloadState,
    role: chatEntry.role,
  })

  const imageUri = localFilePath ? getLocalFileUri(localFilePath) : undefined
  const imagePreviewUri = localPreviewFilePath ? getLocalFileUri(localPreviewFilePath) : undefined
  const imageStyle = getImageStyle(metadata)
  const imagePreview = { uri: preview ?? Image.resolveAssetSource(imagePlaceholder).uri }
  const isMediaUploadError =
    mediaUploadState === MediaUploadState.ErrorCreating ||
    mediaUploadState === MediaUploadState.ErrorUploading

  return (
    <View
      style={[
        displayTimeAndTicks ? styles.withTimeAndTicksContainer : styles.withoutTimeAndTicksContainer,
        { width: imageStyle.width },
      ]}
    >
      {isDownloaded && imagePreviewUri ? (
        <>
          {isMediaUploadError ? (
            <RetryMediaUploadView
              containerStyle={imageStyle}
              isRetryingUpload={isRetryingUpload}
              onRetryMediaUpload={retryMediaUpload}
              uri={imagePreviewUri}
            />
          ) : (
            <>
              <ImageView
                chatEntry={props.chatEntry}
                fileMediaInfo={fileMediaInfo}
                imagePreviewUri={imagePreviewUri}
                imageUri={imageUri!}
                style={imageStyle}
              />
              {mediaUploadState === MediaUploadState.Uploading && (
                <Progress
                  progressColor={theme.colors.green}
                  progress={mediaUploadProgress}
                  style={styles.uploadProgressContainer}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Image source={imagePreview} style={imageStyle} />
          <View style={styles.containerSpinner}>
            {isDownloading ? (
              <React.Fragment>
                <ActivityIndicator color={theme.colors.green} size="large" />
                <Text fontFamily="EuclidCircularA-Medium" style={styles.spinnerText}>
                  {t('personalChat.downloadingImage')}
                </Text>
              </React.Fragment>
            ) : (
              <TouchableOpacity style={styles.btnDownload} onPress={downloadMedia}>
                <Icon as="Ionicons" name="arrow-down-circle" size={30} color={theme.colors.primaryText} />
                {byteCount && (
                  <Text fontFamily="EuclidCircularA-Medium" style={styles.textsize}>
                    {getFileSize(byteCount)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {mediaDownloadState === MediaDownloadState.Downloading && mediaDownloadProgress && (
            <Progress
              progressColor={theme.colors.green}
              progress={mediaDownloadProgress}
              style={styles.uploadProgressContainer}
            />
          )}
        </>
      )}
      {description && (
        <ParsedText
          text={description}
          theme={theme}
          textProps={{ numberOfLines: 10, style: styles.descriptionImg }}
        />
      )}
    </View>
  )
}

export default memo(ImageChatView)
