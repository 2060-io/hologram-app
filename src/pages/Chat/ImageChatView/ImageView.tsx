import { LightboxModal } from '@src/components'
import { UniversalImage } from '@src/components/common'
import { useChat } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@src/pages/Chat/ChatMessage/Props'
import React, { memo, useState } from 'react'
import { ImageStyle, StyleProp, TouchableOpacity } from 'react-native'
import { MediaInfo } from '../ChatProps'
import LightboxHeader from './LightboxHeader'
import getStyles from './styles'

type ImageView = {
  imagePreviewUri: string
  imageUri: string
  fileMediaInfo: MediaInfo
  chatEntry: ChatEntryMessage
  style: StyleProp<ImageStyle>
}

const ImageView = memo((props: ImageView) => {
  const { displayMessageFloatingMenu } = useChat()
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const [showControl, setShowControl] = useState(true)
  const { imagePreviewUri, imageUri, fileMediaInfo, chatEntry } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const onToggleModalLightbox = () => {
    const newIsLightboxVisible = !lightboxVisible
    setLightboxVisible(newIsLightboxVisible)
  }
  const onLongPress = () => displayMessageFloatingMenu(chatEntry)

  const handleControls = () => setShowControl(!showControl)

  return (
    <>
      <LightboxModal
        visible={lightboxVisible}
        closeModal={onToggleModalLightbox}
        renderHeader={() =>
          showControl && (
            <LightboxHeader fileMediaInfo={fileMediaInfo} onBack={onToggleModalLightbox} chatEntry={chatEntry} />
          )
        }
      >
        <TouchableOpacity onPress={handleControls} activeOpacity={1}>
          <UniversalImage source={{ uri: imageUri }} style={styles.imageLightbox} />
        </TouchableOpacity>
      </LightboxModal>
      <TouchableOpacity onPress={onToggleModalLightbox} onLongPress={onLongPress}>
        <UniversalImage style={props.style} source={{ uri: imagePreviewUri }} />
      </TouchableOpacity>
    </>
  )
})

export default ImageView
