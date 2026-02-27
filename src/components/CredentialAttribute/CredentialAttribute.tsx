import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { View, Image, TouchableOpacity, StyleProp, ImageStyle, ViewStyle } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import getStyles from './styles'

import { Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { sanitizeString } from '@src/services/agent/display'
import { CredentialAttributeRow } from '@src/services/agent/formatCredentialSubject'

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
  onPress?: (attributeKey: string) => void
  onPressDetailImage?: (image: string) => void
  style?: StyleProp<ViewStyle>
  rightContent?: React.JSX.Element | null
}

const CredentialAttribute = ({
  attribute,
  onPress,
  onPressDetailImage,
  style,
  rightContent,
}: DetailSectionProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const Wrapper = onPress ? TouchableOpacity : View
  const showSkeleton = 'value' in attribute && !attribute.value.length

  return (
    <Wrapper style={[styles.sectionContainer, style]} onPress={() => onPress?.(attribute.key)}>
      <View style={styles.container}>
        <Text style={styles.sectionKey} fontFamily="EuclidCircularA-Medium">
          {sanitizeString(attribute.key)}
        </Text>
        <Skeleton
          height={styles.sectionValue.fontSize + 2}
          width="75%"
          colorMode={theme.isDarkMode ? 'dark' : 'light'}
          radius="round"
          show={showSkeleton}
        >
          <Text style={styles.sectionValue}>{'value' in attribute && attribute.value}</Text>
        </Skeleton>
      </View>
      {'image' in attribute && (
        <ImageAttribute
          imageStyle={styles.sectionKeyImage}
          onPressDetailImage={onPressDetailImage}
          image={attribute.image}
        />
      )}
      <View style={styles.rightContentContainer}>{rightContent}</View>
    </Wrapper>
  )
}

export default CredentialAttribute
