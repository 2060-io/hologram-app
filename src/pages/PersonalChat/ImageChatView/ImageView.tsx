import React, { memo, useState } from 'react'
import { Image, StatusBar, StyleProp, ImageStyle, TouchableOpacity } from 'react-native'

import { MediaInfo } from '../PersonalChatProps'

import LightboxHeader from './LightboxHeader'
import getStyles from './styles'

import { LightboxModal } from '@2060/components'
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
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const { imagePreviewUri, imageUri, ...lightboxHeaderProps } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const onToggleModalLightbox = (value: boolean) => {
    setLightboxVisible(value)
    StatusBar.setHidden(value)
  }

  return (
    <>
      {lightboxVisible ? (
        <LightboxModal
          visible={lightboxVisible}
          onCloseModal={() => onToggleModalLightbox(false)}
          renderHeader={(close: () => void) => <LightboxHeader onBack={close} {...lightboxHeaderProps} />}
        >
          <Image source={{ uri: imageUri }} style={styles.imageLightbox} />
        </LightboxModal>
      ) : (
        <TouchableOpacity onPress={() => onToggleModalLightbox(true)}>
          <Image style={props.style} source={{ uri: imagePreviewUri }} />
        </TouchableOpacity>
      )}
    </>
  )
})

export default ImageView
