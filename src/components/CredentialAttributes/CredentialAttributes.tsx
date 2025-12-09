import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import CredentialAttribute from '../CredentialAttribute'

import getStyles from './styles'

import { FullScreenImage, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'

type Props = {
  attributes: Record<string, unknown>
}

const CredentialAttributes = ({ attributes }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const attributesSections = formatCredentialSubject({ subject: attributes })
  const [showImageFullScreen, setShowImageFullScreen] = useState(false)
  const biggerImageRef = useRef<string | null>(null)

  const onPressDetailImage = (imageUrl: string) => {
    biggerImageRef.current = imageUrl
    setShowImageFullScreen(true)
  }

  const closeFullScreenImage = () => setShowImageFullScreen(false)

  return (
    <>
      <FullScreenImage
        showFullScreenImage={showImageFullScreen}
        closeFullScreenImage={closeFullScreenImage}
        imageUri={biggerImageRef.current!}
      />
      {attributesSections.map((section, index) => (
        <View key={index}>
          <Text style={styles.title} fontFamily="EuclidCircularA-SemiBold">
            {section.title ?? t('credentialOffer.claims')}
          </Text>
          <View style={styles.sectionRowsContainer}>
            {section.rows.map(rowDetail => (
              <CredentialAttribute
                key={rowDetail.key}
                attribute={rowDetail}
                onPressDetailImage={onPressDetailImage}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  )
}

export default CredentialAttributes
