import React from 'react'
import { ImageStyle, Image, StyleProp } from 'react-native'

import { useImage } from './useImage'

type Props = {
  uri: string
  setIsValidImageUrl: (isValid: boolean) => void
  onImageContent: (imageContent: string) => void
  style?: StyleProp<ImageStyle>
}

const SmartImage = ({ uri, setIsValidImageUrl, onImageContent, style }: Props) => {
  const onError = () => setIsValidImageUrl(false)
  const { imageContent } = useImage({ uri, onError, onImageContent })

  return imageContent ? <Image source={{ uri: imageContent }} style={style} /> : null
}

export default SmartImage
