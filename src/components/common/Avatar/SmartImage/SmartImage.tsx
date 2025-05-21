import React from 'react'
import { ImageStyle, Image, StyleProp } from 'react-native'

import { useImage } from './useImage'

type Props = {
  uri: string
  setIsValidImageUrl: (isValid: boolean) => void
  style?: StyleProp<ImageStyle>
}

const SmartImage = ({ uri, setIsValidImageUrl, style }: Props) => {
  const onError = () => setIsValidImageUrl(false)
  const { imageContent } = useImage({ uri, onError })

  return imageContent ? <Image source={{ uri: imageContent }} style={style} /> : null
}

export default SmartImage
