import React from 'react'
import { View, Image, TouchableOpacity, StyleProp, ImageStyle, ViewStyle } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import getStyles from './styles'

import { Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { sanitizeString } from '@2060/services/agent/display'
import { CredentialAttributeRow } from '@2060/services/agent/formatCredentialSubject'

type ImageSectionProps = {
  image: string
  onPressDetailImage?: (image: string) => void
  imageStyle: StyleProp<ImageStyle>
}

const ImageAttribute = ({ image, onPressDetailImage, imageStyle }: ImageSectionProps) => {
  const jpegImage = EIdReader.imageDataUrlToJpegDataUrl(image)

  return jpegImage ? (
    <TouchableOpacity onPress={() => onPressDetailImage?.(jpegImage)}>
      <Image style={imageStyle} resizeMode="contain" source={{ uri: jpegImage }} />
    </TouchableOpacity>
  ) : null
}

type DetailSectionProps = {
  attribute: CredentialAttributeRow
  onPressDetailImage?: (image: string) => void
  onPress?: (attributeKey: string) => void
  style?: StyleProp<ViewStyle>
}

const CredentialAttribute = ({ attribute, onPressDetailImage, onPress, style }: DetailSectionProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const Wrapper = onPress ? TouchableOpacity : View

  return (
    <Wrapper style={[styles.sectionContainer, style]} onPress={() => onPress?.(attribute.key)}>
      <View style={styles.container}>
        <Text style={styles.sectionKey} fontFamily="EuclidCircularA-Medium">
          {sanitizeString(attribute.key)}
        </Text>
        <Text style={styles.sectionValue} fontFamily="EuclidCircularA-Regular">
          {'value' in attribute && attribute.value}
        </Text>
      </View>
      {'image' in attribute && (
        <ImageAttribute
          imageStyle={styles.sectionKeyImage}
          onPressDetailImage={onPressDetailImage}
          image={attribute.image}
        />
      )}
    </Wrapper>
  )
}

export default CredentialAttribute
