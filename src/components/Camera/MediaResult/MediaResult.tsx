import React from 'react'
import { Image, View } from 'react-native'

import { MediaCaptured } from '../Props'

import VideoRecorded from './VideoRecorded'
import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  visible: boolean
  renderCloseButton: () => React.JSX.Element
  renderSendButton: () => React.JSX.Element
  mediaCaptured: MediaCaptured | null
}

const MediaResult = ({ visible, renderCloseButton, renderSendButton, mediaCaptured }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={{ ...styles.container, display: visible ? 'flex' : 'none' }}>
      {renderCloseButton()}
      {mediaCaptured ? (
        mediaCaptured.type === 'image' ? (
          <Image
            source={{ uri: mediaCaptured.path }}
            style={styles.takenPhotoContainer}
            resizeMode="contain"
          />
        ) : (
          <VideoRecorded path={mediaCaptured.path} />
        )
      ) : (
        <></>
      )}
      {renderSendButton()}
    </View>
  )
}

export default MediaResult
