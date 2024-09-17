import React, { memo, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ImageBackground, ActivityIndicator, Image } from 'react-native'

import { MediaProps } from '../PersonalChatProps'
import RetryMediaUploadView from '../RetryMediaUploadView'
import { ParsedText } from '../components'
import { getMinutesAndSeconds } from '../utils'

import getStyles from './styles'

import placeHolderVideo from '@2060/assets/images/placeholderVideo.png'
import { Text, SvgIcon, Progress } from '@2060/components/common'
import { useMedia } from '@2060/hooks'
import { useMediaPlayer } from '@2060/hooks/agent/MediaPlayerProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { MediaDownloadState, MediaUploadState } from '@2060/model'
import { getFileSize } from '@2060/utils'
import { getLocalFileUri } from '@2060/utils/RNFS'

const VideoChatView = memo((props: MediaProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { mediaItem, mediaRecordId, fileMediaInfo, currentMessage } = props
  const {
    localFilePath,
    duration,
    byteCount,
    mediaUploadState,
    localPreviewFilePath,
    preview,
    mediaUploadProgress,
    description,
    mediaDownloadState,
    mediaDownloadProgress,
  } = mediaItem
  const { playVideo } = useMediaPlayer()
  const { isDownloaded, isDownloading, downloadMedia, retryMediaUpload, isRetryingUpload } = useMedia({
    mediaRecordId,
    localFilePath,
    type: 'videos',
    mediaDownloadState,
    role: currentMessage.role,
  })

  const textDuration = getMinutesAndSeconds(duration as number)
  const isMediaUploadError =
    mediaUploadState === MediaUploadState.ErrorCreating ||
    mediaUploadState === MediaUploadState.ErrorUploading

  const videoFileUri = getLocalFileUri(localFilePath)
  const localPreviewSource = localPreviewFilePath
    ? {
        uri: getLocalFileUri(localPreviewFilePath),
      }
    : undefined
  const imagePreview = { uri: preview ?? Image.resolveAssetSource(placeHolderVideo).uri }

  const renderVideoView = () => {
    return (
      <>
        <ImageBackground
          source={localPreviewSource ?? imagePreview}
          resizeMode="cover"
          blurRadius={6}
          style={styles.containerVideo}
        >
          <TouchableOpacity
            style={styles.btnPlayVideo}
            onPress={() => videoFileUri && playVideo({ videoFileUri, fileMediaInfo, currentMessage })}
          >
            <SvgIcon name="playCircle" fill={theme.colors.primary} width={70} height={70} />
          </TouchableOpacity>
          {renderVideoDuration()}
        </ImageBackground>
        {mediaUploadState === MediaUploadState.Uploading && (
          <Progress
            progressColor={theme.colors.green}
            progress={mediaUploadProgress}
            style={styles.uploadProgressContainer}
          />
        )}
      </>
    )
  }

  const renderVideoDuration = () => (
    <View style={styles.containerDuration}>
      <SvgIcon name="video" fill={theme.colors.primary} />
      <Text typography="EuclidCircularA-Medium" style={styles.textDuraction}>
        {textDuration}
      </Text>
    </View>
  )

  const renderDownloadView = () => (
    <ImageBackground
      source={localPreviewSource ?? imagePreview}
      resizeMode="cover"
      blurRadius={6}
      style={styles.imageBackground}
    >
      <View style={styles.containerViewDownlod}>
        {renderVideoDuration()}
        <View style={styles.containerSpinner}>
          {isDownloading ? (
            <>
              <ActivityIndicator color={theme.colors.green} size="large" />
              <Text typography="EuclidCircularA-Medium" style={styles.spinnerText}>
                {t('personalChat.downloadingVideo')}
              </Text>
            </>
          ) : (
            <TouchableOpacity style={styles.btnDownload} onPress={downloadMedia}>
              <SvgIcon name="download" fill={theme.colors.primary} />
              {byteCount && (
                <Text typography="EuclidCircularA-Medium" style={styles.textsize}>
                  {getFileSize(byteCount)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ImageBackground>
  )

  return (
    <>
      <View style={styles.containerRootVideo}>
        {isDownloaded ? (
          <Fragment>
            {isMediaUploadError ? (
              <RetryMediaUploadView
                uri={localPreviewSource?.uri ?? imagePreview.uri}
                isRetryingUpload={isRetryingUpload}
                containerStyle={styles.containerVideo}
                onRetryMediaUpload={retryMediaUpload}
              />
            ) : (
              renderVideoView()
            )}
          </Fragment>
        ) : (
          <>
            {renderDownloadView()}
            {mediaDownloadState === MediaDownloadState.Downloading && mediaDownloadProgress && (
              <Progress
                progressColor={theme.colors.green}
                progress={mediaDownloadProgress}
                style={styles.uploadProgressContainer}
              />
            )}
          </>
        )}
      </View>
      {description && (
        <ParsedText
          text={description}
          theme={theme}
          textProps={{ numberOfLines: 10, style: styles.videoDescription }}
        />
      )}
    </>
  )
})

export default memo(VideoChatView)
