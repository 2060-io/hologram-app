import React, { memo, useState } from 'react'
import { Image, StyleProp, ImageStyle, TouchableOpacity } from 'react-native'

import { MediaInfo } from '../PersonalChatProps'

import LightboxHeader from './LightboxHeader'
import getStyles from './styles'

import { LightboxModal } from '@src/components'
import { useChat } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@src/pages/PersonalChat/ChatMessage/Props'

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
            <LightboxHeader
              fileMediaInfo={fileMediaInfo}
              onBack={onToggleModalLightbox}
              chatEntry={chatEntry}
            />
          )
        }
      >
        <TouchableOpacity onPress={handleControls} activeOpacity={1}>
          <Image source={{ uri: imageUri }} style={styles.imageLightbox} />
        </TouchableOpacity>
      </LightboxModal>
      <TouchableOpacity onPress={onToggleModalLightbox} onLongPress={onLongPress}>
        <Image style={props.style} source={{ uri: imagePreviewUri }} />
      </TouchableOpacity>
    </>
  )
})

export default ImageView
