import React, { useEffect } from 'react'
import { ImageStyle, Image, StyleProp } from 'react-native'

import { useImage } from './useImage'

import UniversalImage, { isSvgUri } from '@src/components/common/UniversalImage'

const isHttpUrl = (uri: string) => uri.startsWith('https://') || uri.startsWith('http://')

// Metro dev packager asset URL, e.g.
// http://<host>:8081/assets/src/assets/images/foo.png?platform=ios&hash=...
// These are bundled assets served over HTTP only in dev on-device; they must not
// go through the remote download/resize pipeline.
const isMetroAssetUrl = (uri: string) =>
  /\/assets\/.+[?&]platform=(ios|android|web)\b/.test(uri)

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

  if (isHttpUrl(uri) && !isSvgUri(uri) && !isMetroAssetUrl(uri)) {
    return <CachedImage {...props} />
  }

  return <DirectImage {...props} />
}

export default SmartImage
