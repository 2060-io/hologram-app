import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Image, TouchableOpacity } from 'react-native'
import EIdReader from 'react-native-eid-reader'

import getStyles from './styles'

import { CardCredentialMainInformation, FullScreenImage, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialDetailsForDisplay } from '@2060/services/agent/display'
import { formatCredentialSubject, CredentialAttributeRow } from '@2060/services/agent/formatCredentialSubject'

interface StyleObject {
  [key: string]: object
}

type DetailSectionProps = {
  isFirst: boolean
  styles: StyleObject
  rowDetail: CredentialAttributeRow
  onPressDetailImage: (image: string) => void
}

type ImageSectionProps = {
  image: string
  onPressDetailImage: (image: string) => void
  styles: StyleObject
}

const ImageSection = ({ image, onPressDetailImage, styles }: ImageSectionProps) => {
  const jpegImage = EIdReader.imageDataUrlToJpegDataUrl(image)

  return jpegImage ? (
    <TouchableOpacity onPress={() => onPressDetailImage(jpegImage)}>
      <Image style={styles.sectionKeyImage} resizeMode="contain" source={{ uri: jpegImage }} />
    </TouchableOpacity>
  ) : null
}

const DetailSection = ({ isFirst, styles, rowDetail, onPressDetailImage }: DetailSectionProps) => (
  <View style={styles.sectionContainer}>
    <View style={styles.container}>
      <Text style={[styles.sectionKey, isFirst && styles.firstSection]} typography="EuclidCircularA-Medium">
        {rowDetail.key}
      </Text>
      <Text style={styles.sectionValue} typography="EuclidCircularA-Regular">
        {'value' in rowDetail && rowDetail.value}
      </Text>
    </View>
    {'image' in rowDetail && (
      <ImageSection styles={styles} onPressDetailImage={onPressDetailImage} image={rowDetail.image} />
    )}
  </View>
)

type Props = {
  credentialDetails: CredentialDetailsForDisplay
}

const CredentialDetails = ({ credentialDetails }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const detailsSections = formatCredentialSubject({ subject: credentialDetails.attributes })
  const [showImageFullScreen, setShowImageFullScreen] = useState(false)
  const biggerImageRef = useRef<string | null>(null)

  const onPressDetailImage = (imageUrl: string) => {
    biggerImageRef.current = imageUrl
    setShowImageFullScreen(true)
  }
  const closeFullScreenImage = () => setShowImageFullScreen(false)

  return (
    <View style={styles.container}>
      <FullScreenImage
        showFullScreenImage={showImageFullScreen}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={biggerImageRef.current!}
      />
      <CardCredentialMainInformation
        credentialMainInfo={credentialDetails.mainInfo}
        containerStyle={styles.credentialMainInfoContainer}
      />
      {detailsSections.map((section, index) => (
        <View key={index}>
          <Text style={styles.title} typography="EuclidCircularA-SemiBold">
            {section.title ?? t('credentialOffer.claims')}
          </Text>
          <View style={styles.sectionRowsContainer}>
            {section.rows.map((rowDetail, sectionIndex) => (
              <DetailSection
                isFirst={sectionIndex === 0}
                key={rowDetail.key}
                styles={styles}
                rowDetail={rowDetail}
                onPressDetailImage={onPressDetailImage}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

export default CredentialDetails
