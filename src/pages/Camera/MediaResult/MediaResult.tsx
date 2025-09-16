import React from 'react'
import { Image, View } from 'react-native'

import { MediaCaptured } from '../useCamera'

import VideoRecorded from './VideoRecorded'
import getStyles from './styles'

import { Modal } from '@2060/components/common'
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
    <Modal animationType="fade" transparent statusBarTranslucent={false} visible={visible}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {renderCloseButton()}
          {mediaCaptured ? (
            mediaCaptured.type === 'image' ? (
              <Image
                source={{ uri: mediaCaptured.data.path }}
                style={styles.takenPhotoContainer}
                resizeMode="contain"
              />
            ) : (
              <VideoRecorded path={mediaCaptured.data.path} />
            )
          ) : (
            <></>
          )}
          {renderSendButton()}
        </View>
      </View>
    </Modal>
  )
}

export default MediaResult
