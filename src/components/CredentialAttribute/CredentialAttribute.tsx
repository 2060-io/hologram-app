import { Text, UniversalImage } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { sanitizeString } from '@src/services/agent/display'
import { CredentialAttributeRow } from '@src/services/agent/formatCredentialSubject'
import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { ImageStyle, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native'
import getStyles from './styles'

type ImageSectionProps = {
  image: string
  onPressDetailImage?: (image: string) => void
  imageStyle: StyleProp<ImageStyle>
}

const ImageAttribute = ({ image, onPressDetailImage, imageStyle }: ImageSectionProps) => {
  return image ? (
    <TouchableOpacity onPress={() => onPressDetailImage?.(image)}>
      <UniversalImage style={imageStyle} resizeMode="contain" source={{ uri: image }} />
    </TouchableOpacity>
  ) : null
}

type DetailSectionProps = {
  attribute: CredentialAttributeRow
  onPress?: (attributeKey: string) => void
  onPressDetailImage?: (image: string) => void
  style?: StyleProp<ViewStyle>
  rightContent?: React.JSX.Element | null
  valuePending?: boolean
}

const EMPTY_VALUE_PLACEHOLDER = '—'

const CredentialAttribute = ({
  attribute,
  onPress,
  onPressDetailImage,
  style,
  rightContent,
  valuePending,
}: DetailSectionProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const Wrapper = onPress ? TouchableOpacity : View
  const isEmpty = 'value' in attribute && !attribute.value.length
  const showSkeleton = isEmpty && !!valuePending

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
          <Text style={styles.sectionValue}>
            {isEmpty ? EMPTY_VALUE_PLACEHOLDER : 'value' in attribute && attribute.value}
          </Text>
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
