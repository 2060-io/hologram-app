import placeHolderVideo from '@src/assets/images/placeholderVideo.png'
import { Progress, SvgIcon, Text } from '@src/components/common'
import { useMedia } from '@src/hooks'
import { useMediaPlayer } from '@src/hooks/providers/MediaPlayerProvider'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { MediaDownloadState, MediaUploadState, VideoMetadata } from '@src/model'
import { getFileSize } from '@src/utils'
import { getLocalFileUri } from '@src/utils/RNFS'
import React, { Fragment, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ImageBackground, TouchableOpacity, View } from 'react-native'
import { MediaProps } from '../ChatProps'
import { ParsedText } from '../components'
import RetryMediaUploadView from '../RetryMediaUploadView'
import { getMinutesAndSeconds } from '../utils'
import getStyles from './styles'

const VideoChatView = memo((props: MediaProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { mediaRecordId, fileMediaInfo, chatEntry, displayTimeAndTicks } = props
  const metadata = chatEntry.metadata as VideoMetadata
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
  } = metadata
  const { playVideo } = useMediaPlayer()
  const { isDownloaded, isDownloading, downloadMedia, retryMediaUpload, isRetryingUpload } = useMedia({
    mediaRecordId,
    localFilePath,
    type: 'videos',
    mediaDownloadState,
    role: chatEntry.role,
  })

  const textDuration = getMinutesAndSeconds(duration as number)
  const isMediaUploadError =
    mediaUploadState === MediaUploadState.ErrorCreating || mediaUploadState === MediaUploadState.ErrorUploading

  const videoFileUri = localFilePath ? getLocalFileUri(localFilePath) : undefined
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
            onPress={() => videoFileUri && playVideo({ videoFileUri, fileMediaInfo, chatEntry })}
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
      <Text fontFamily="EuclidCircularA-Medium" style={styles.textDuraction}>
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
              <Text fontFamily="EuclidCircularA-Medium" style={styles.spinnerText}>
                {t('chat.downloadingVideo')}
              </Text>
            </>
          ) : (
            <TouchableOpacity style={styles.btnDownload} onPress={downloadMedia}>
              <SvgIcon name="download" fill={theme.colors.primary} />
              {byteCount && (
                <Text fontFamily="EuclidCircularA-Medium" style={styles.textsize}>
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
    <View style={displayTimeAndTicks ? styles.withTimeAndTicksContainer : styles.withoutTimeAndTicksContainer}>
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
    </View>
  )
})

export default memo(VideoChatView)
