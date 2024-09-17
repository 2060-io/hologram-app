import dayjs, { Dayjs } from 'dayjs'
import React, { memo, useState } from 'react'
import { View, Image, StatusBar, StyleProp, ImageStyle } from 'react-native'

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
  const [pressureTime, setPressureTime] = useState<Dayjs>()
  const [lightboxVisible, setLightboxVisible] = useState(false)
  const { imagePreviewUri, imageUri, ...lightboxHeaderProps } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const onToggleModalLightbox = (value: boolean) => {
    setLightboxVisible(value)
    StatusBar.setHidden(value)
  }
  const handlePressIn = () => setPressureTime(dayjs(Date.now()))
  const handlePressOut = () => {
    const finalTimePressed = dayjs(Date.now()).format()
    const diff = dayjs(finalTimePressed).diff(pressureTime?.format(), 'millisecond')
    diff === 0 && onToggleModalLightbox(true)
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
        <View onTouchStart={handlePressIn} onTouchEnd={handlePressOut}>
          <Image style={props.style} source={{ uri: imagePreviewUri }} />
        </View>
      )}
    </>
  )
})

export default ImageView
