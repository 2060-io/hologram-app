import React, { memo, useState } from 'react'
import { Image, StyleProp, ImageStyle, TouchableOpacity } from 'react-native'

import { MediaInfo } from '../PersonalChatProps'

import LightboxHeader from './LightboxHeader'
import getStyles from './styles'

import { LightboxModal } from '@2060/components'
import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'

type ImageView = {
  imagePreviewUri: string
  imageUri: string
  fileMediaInfo: MediaInfo
  currentMessage: ChatEntryMessage
  style: StyleProp<ImageStyle>
}

const ImageView = memo((props: ImageView) => {
  const { displayMessageFloatingMenu } = useChat()
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const [showControl, setShowControl] = useState(true)
  const { imagePreviewUri, imageUri, fileMediaInfo, currentMessage } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const onToggleModalLightbox = () => {
    const newIsLightboxVisible = !lightboxVisible
    setLightboxVisible(newIsLightboxVisible)
  }
  const onLongPress = () => displayMessageFloatingMenu(currentMessage)

  const handleControls = () => setShowControl(!showControl)

  return (
    <>
      <LightboxModal
        visible={lightboxVisible}
        onCloseModal={onToggleModalLightbox}
        renderHeader={close =>
          showControl && (
            <LightboxHeader fileMediaInfo={fileMediaInfo} onBack={close} currentMessage={currentMessage} />
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
