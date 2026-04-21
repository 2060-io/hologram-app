import React, { useEffect } from 'react'
import { ImageStyle, Image, StyleProp } from 'react-native'

import { useImage } from './useImage'

import UniversalImage, { isSvgUri } from '@src/components/common/UniversalImage'

const isHttpUrl = (uri: string) => uri.startsWith('https://') || uri.startsWith('http://')

type Props = {
  uri: string
  setIsValidImageUrl?: (isValid: boolean) => void
  onImageContent?: (imageContent: string) => void
  style?: StyleProp<ImageStyle>
  enableImageRefresh?: boolean
}

const CachedImage = ({
  uri,
  setIsValidImageUrl,
  onImageContent,
  style,
  enableImageRefresh = true,
}: Props) => {
  const onError = () => setIsValidImageUrl?.(false)
  const handleImageContent = onImageContent ?? (() => {})
  const { imageContent } = useImage({ uri, onError, onImageContent: handleImageContent, enableImageRefresh })

  return imageContent ? <Image source={{ uri: imageContent }} style={style} /> : null
}

const DirectImage = ({ uri, setIsValidImageUrl, onImageContent, style }: Props) => {
  useEffect(() => {
    onImageContent?.(uri)
  }, [uri])

  const handleError = () => setIsValidImageUrl?.(false)
  return <UniversalImage source={{ uri }} style={style} onError={handleError} onImageError={handleError} />
}

const SmartImage = (props: Props) => {
  const { uri } = props

  if (isHttpUrl(uri) && !isSvgUri(uri)) {
    return <CachedImage {...props} />
  }

  return <DirectImage {...props} />
}

export default SmartImage
