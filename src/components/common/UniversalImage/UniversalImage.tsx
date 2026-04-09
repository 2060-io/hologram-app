import React from 'react'
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native'
import EIdReader from 'react-native-eid-reader'
import { NumberProp, SvgUri } from 'react-native-svg'

const isSvgUri = (uri?: string) => uri?.endsWith('.svg') || uri?.includes('data:image/svg+xml')

const isJpeg2000DataUrl = (uri?: string) =>
  uri?.includes('data:image/jp2') || uri?.includes('data:image/jpeg2000')

type Props = ImageProps & {
  svgWidth?: NumberProp
  svgHeight?: NumberProp
  onImageError?: () => void
}

const UniversalImage = ({ svgWidth, svgHeight, onImageError, ...imageProps }: Props) => {
  const source = imageProps.source
  const uri = source && typeof source === 'object' && 'uri' in source ? source.uri : undefined

  if (uri && isSvgUri(uri)) {
    const flatStyle = (
      imageProps.style
        ? Object.assign({}, ...(Array.isArray(imageProps.style) ? imageProps.style : [imageProps.style]))
        : {}
    ) as ImageStyle

    const width = svgWidth ?? (flatStyle.width as NumberProp) ?? '100%'
    const height = svgHeight ?? (flatStyle.height as NumberProp) ?? '100%'

    return (
      <SvgUri
        uri={uri}
        style={imageProps.style as StyleProp<ImageStyle>}
        width={width}
        height={height}
        onError={onImageError}
      />
    )
  }

  const resolvedSource =
    uri && isJpeg2000DataUrl(uri) ? { uri: EIdReader.imageDataUrlToJpegDataUrl(uri) } : imageProps.source

  return <Image {...imageProps} source={resolvedSource} />
}

export { isSvgUri }
export default UniversalImage
